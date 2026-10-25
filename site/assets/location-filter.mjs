import {matchingSchools} from './compare.mjs';

export const stateNames={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};

export function filterByLocation(cards,selection,schoolId=null){
  for(const card of cards)card.hidden=Boolean(selection&&(card.dataset.state!==selection.state||selection.city&&card.dataset.city!==selection.city)||schoolId&&card.dataset.schoolId!==schoolId);
  return cards.filter(card=>!card.hidden).length;
}

export function createLocationFilter(form,update){
  const cards=Array.from(document.querySelectorAll('.school-card')),status=form.querySelector('#location-status'),schoolStatus=form.querySelector('#ranking-school-status');
  const locations=new Map();
  for(const {dataset:{city,state}}of cards){
    locations.set(state,{city:'',state,label:`${stateNames[state]} (${state})`});
    locations.set(`${city}, ${state}`,{city,state,label:`${city}, ${state}`});
  }
  let selected=null,selectedSchool=null;
  const picker=(prefix,entries,select)=>{
    const search=form.querySelector(`#${prefix}-search`),dropdown=form.querySelector(`#${prefix}-dropdown`),list=form.querySelector(`#${prefix}-options`),empty=form.querySelector(`#${prefix}-search-empty`),clear=form.querySelector(`#${prefix}-clear`);
    const options=entries.map((entry,index)=>{
      const option=document.createElement('button');option.type='button';option.role='option';option.id=prefix+'-option-'+index;option.setAttribute('aria-selected','false');
      Object.assign(option.dataset,entry);option.textContent=entry.label;list.append(option);return option;
    });
    let active=-1;
    const close=()=>{dropdown.hidden=true;search.setAttribute('aria-expanded','false');search.removeAttribute('aria-activedescendant');active=-1;};
    const suggestions=()=>{
      const matches=matchingSchools(options,search.value);active=-1;search.removeAttribute('aria-activedescendant');
      for(const option of options){option.hidden=!matches.includes(option);option.classList.remove('active-option');}
      empty.hidden=matches.length>0;dropdown.hidden=!search.value.trim();search.setAttribute('aria-expanded',String(!dropdown.hidden));
    };
    const choose=option=>{
      if(!option)return;select(option.dataset);search.value=option.dataset.label;
      for(const other of options)other.setAttribute('aria-selected',String(other===option));
      clear.hidden=false;update();search.focus();close();
    };
    const reset=()=>{select(null);search.value='';clear.hidden=true;for(const option of options)option.setAttribute('aria-selected','false');close();update();};
    search.addEventListener('input',()=>{if(!search.value.trim())reset();else suggestions();});
    search.addEventListener('focus',suggestions);
    search.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();return;}
      if(!['ArrowDown','ArrowUp','Enter'].includes(event.key))return;
      event.preventDefault();if(dropdown.hidden)suggestions();
      const available=options.filter(option=>!option.hidden);
      if(event.key==='Enter'){choose(available[active<0?0:active]);return;}
      if(!available.length)return;
      active=active<0?(event.key==='ArrowDown'?0:available.length-1):(active+(event.key==='ArrowDown'?1:-1)+available.length)%available.length;
      for(const option of options)option.classList.toggle('active-option',option===available[active]);
      search.setAttribute('aria-activedescendant',available[active].id);available[active].scrollIntoView({block:'nearest'});
    });
    list.addEventListener('click',event=>choose(event.target.closest('button[role="option"]')));
    clear.addEventListener('click',()=>{reset();search.focus();});
    document.addEventListener('pointerdown',event=>{if(!search.parentElement.contains(event.target))close();});
  };
  picker('location',[...locations.values()].sort((a,b)=>Boolean(a.city)-Boolean(b.city)||a.label.localeCompare(b.label)).map(entry=>({...entry,search:`${entry.label} ${stateNames[entry.state]}`})),value=>{selected=value;});
  picker('ranking-school',cards.map(card=>({schoolId:card.dataset.schoolId,label:card.querySelector('h2').textContent,search:`${card.dataset.schoolName} ${card.querySelector('h2').textContent} ${card.dataset.city} ${card.dataset.state}`})).sort((a,b)=>a.label.localeCompare(b.label)),value=>{selectedSchool=value;});
  return key=>{
    const locationCount=filterByLocation(cards,selected),count=filterByLocation(cards,selected,selectedSchool?.schoolId),nr=document.querySelector('.nr-section');
    if(nr)nr.hidden=!Array.from(nr.querySelectorAll('.school-card')).some(card=>!card.hidden);
    status.textContent=`${locationCount} school${locationCount===1?'':'s'}${selected?' in '+selected.label:' across all locations'}.`;
    schoolStatus.textContent=selectedSchool?`${count} matching school${count===1?'':'s'}: ${selectedSchool.label}.`:'No school selected.';
    document.querySelector('#ranking-empty').hidden=count!==0;
  };
}
