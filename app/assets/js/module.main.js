const cardImageW=512,cardImageH=328,cardImageSRC="app/assets/backs/card_back.jpg",DOMAIN="",API_URL=DOMAIN+"/api",TERMS_URL=DOMAIN+"/politika-konfidentsialnosti",RULES_URL=DOMAIN+"/pravila",LS_TOKEN="LS_BearerToken",LS_SECTION="section",SOURCE="WEB2";let lastPhone="",secondsInterval=null,secondsLeft=0,d=document,resetCodeTimer=null,resetCodeTimerValue=0,sections={adult:{},intro:{},registration:{title:"Регистрация",prevSection:"pre-registration"},"pre-registration":{title:"Выбор города",prevSection:"intro"},authorization:{title:"Вход",prevSection:"intro"},reset:{title:"Сброс пароля",prevSection:"authorization"},personal:{title:"Профиль",showMenu:!0,needAuth:!0},wallet:{title:"Кошелек",showMenu:!0,needAuth:!0},news:{title:"Новости",showMenu:!0,needAuth:!0},refer:{title:"Приглашение",showMenu:!0,needAuth:!0},stores:{title:"Магазины",showMenu:!0,needAuth:!0},reg_success:{title:"Регистрация завершена",showMenu:!0,needAuth:!0},alerts:{title:"Подписки и уведомления",showMenu:!0,needAuth:!0},personal_update:{title:"Смена данных",showMenu:!0,prevSection:"personal",needAuth:!0},set_plastic:{title:"Привязка карты",showMenu:!0,prevSection:"personal_update",needAuth:!0}},currentSection="",bearerToken="",currentUpdates={personalHash:"",walletHash:"",storesHash:"",lastNews:"",lastPurchase:"",lastTransaction:""},currentCity="",userActivityTimeout=null;function hide(e){C(e).el.style.display="none"}function show(e){C(e).el.style.display=""}function initPopups(){let e=C(".popup-text").els;e.forEach(t=>{t.addEventListener("click",function(e){t.classList.contains("show")&&t.classList.remove("show")})})}function userActivity(e){userActivityTimeout=userActivityTimeout||setTimeout(checkUpdates,3333,currentUpdates)}function modifyInput(e){1===e.value.length&&8==+e.value[0]&&(e.value="+7-")}function openNav(){show("#overlay-menu")}function closeNav(){hide("#overlay-menu")}async function promiseTimeout(e,t){return await new Promise(e=>setTimeout(e,t)),e()}function removeChildrens(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function routePrevSection(){var e=localStorage.getItem(LS_SECTION);sections[e]&&sections[e].prevSection&&drawSection(sections[e].prevSection)}function drawSection(t){switch(t=t||"adult"){case"pre-registration":updateCities();break;case"registration":updateCities().then(e=>{let t=C("#city").el;show("#registration_cont"),hide("#reg_confirmation"),C("#prem").el.checked=!0,C("#discount").el.checked=!1,(0===t.options[t.options.selectedIndex].getAttribute("default-discount")?hide:show)("#loyalty-system")});break;case"personal":case"stores":case"wallet":break;case"refer":renderReferSection()}let e=C(".main > div").els,a=(e.forEach(function(e){e.id===t?(e.classList.contains("active")||e.classList.add("active"),C(".main").el.scrollIntoView()):e.classList.remove("active"),hideLoader()}),C("header").el.style.display=sections[t]&&sections[t].title?"":"none",C(".topNav__back").el.style.display=sections[t]&&sections[t].prevSection?"":"none",C(".topNav__msg").el.style.display=sections[t]&&!sections[t].prevSection?"":"none",C("header h6").text(sections[t].title),C(".topNav__menu").el.style.display=sections[t]&&sections[t].showMenu?"":"none",C(".topNav__close").el.style.display=-1===["alerts"].indexOf(t)?"none":"",C("footer").el),s=(a.style.display=sections[t]&&sections[t].showMenu?"":"none",C(".bottomNav > li").els);s.forEach(e=>{e.classList.remove("current-section"),e.dataset.section===t&&e.classList.add("current-section")}),localStorage.setItem(LS_SECTION,t)}function renderReferSection(){getReferLink().then(t=>{let a=C("#referQr").el;if(t.status){if(!a.children.length){let e=C().create("canvas").el;new QRious({element:e,size:192,value:t.data.link});a.appendChild(e),e.classList.add("animate__animated","animate__fadeIn"),show("#referLink"),C("#referLinkTG").attr("href","https://t.me/share/url?url="+t.data.link+"&text=Столица: бонусы&utm_source=ref_tg"),C("#referLinkWA").attr("href","https://api.whatsapp.com/send?text=Столица: бонусы "+t.data.link+"&utm_source=ref_wa")}t.data.referrals&&t.data.referrals.length&&t.data.referrals.forEach(e=>{let t=C().create("tr"),a=C().create("td");a.text(e.last_sync),t.append(a),(a=C().create("td")).text("7-***-***-"+e.phone),t.append(a),(a=C().create("td")).text(e.gifted?"Совершена покупка":"Регистрация по приглашению"),t.append(a),a=C().create("td"),e.gifted&&a.style("fontWeight","bold"),a.text(e.gifted?"+"+e.referral_gift:"n/a"),a.addclass(e.gifted?"good":"bad"),t.append(a),C("#referrals").append(t)})}})}function confirmAdult(){drawSection(localStorage.getItem(LS_SECTION))}function showPopup(e,t,a,s,n){let o=C("#popupOverlay"),i=C("#popupTitle"),r=C("#popupDescription"),l=C("#popupMessage"),c=C("#popupButton");s=s||"Ок",n?o.el.callback=n:n=null,hideLoader(),show("#popupOverlay"),e?(show("#popupTitle"),i.text(e)):hide("#popupTitle"),t?(r.text(t),show("#popupDescription")):hide("#popupDescription"),a?(l.text(a),show("#popupMessage")):hide("#popupMessage"),c.text(s),o.delclass(["animate__fadeIn","animate__fadeOut","animate__animated","animate__furious"]),o.addclass(["animate__animated","animate__fadeIn","animate__furious"])}function showLoader(){let e=C("#loader");e.style("opacity",1),show("#loader")}function hideLoader(){let e=C("#loader");e.addclass(["animate__fadeOut","animate__animated"]),promiseTimeout(function(){hide("#loader"),e.delclass(["animate__fadeOut","animate__animated"])},500)}function checkAuthorization(){return fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8",Authorization:"Bearer "+(bearerToken||"")},body:JSON.stringify({method:"checkAuthorization"})}).then(e=>e.json()).catch(e=>({status:!1,description:e.message,error:e}))}async function auth(){let t=C("#auth-phone-mask"),a=C("#auth-pass"),s=C("#auth-pass-popup"),n=getPhoneNumbers(C("#auth-phone-mask").val()),o=C("#auth-button").el;if(n&&11===n.length){if(t.delclass("fail"),""===a.val())return a.el.scrollIntoView(),a.togclass("fail"),a.el.focus(),void s.togclass("show");o.disabled=!0;var i={method:"authorization",data:{phone:n,pass:a.val()}};let e=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify(i)});i=await e.json();o.disabled=!1,i.status?(clearLocalStorage(),localStorage.setItem(LS_TOKEN,i.data.token),localStorage.setItem(LS_SECTION,"wallet"),location.reload()):showPopup("",i.description)}else showInputPopup("auth-phone-mask")}function checkReg(){let e=C("#reg-phone-mask"),t=C("#reg-birthdate").el,a=C("#reg-pass"),s=C("#reg-pass-confirm"),n=getPhoneNumbers(e.val());return 11!==n.length?(showInputPopup("reg-phone-mask"),0):(e.delclass("fail"),a.val().length<6?(showInputPopup("reg-pass"),0):validateBirthdate(t)?a.val()!==s.val()?(showPopup("Внимание","Введенные пароли не совпадают!"),0):1:0)}async function reg(){let e=C("#reg-phone-mask"),t=C("#reg-birthdate"),a=C("#reg-button").el,s=null,n=getPhoneNumbers(e.val());if(t.val()){let e=t.val().split("-");s=[e[2],e[1],e[0]].join("-")}lastPhone=n,a.disabled=!0,showLoader();let o=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify({method:"registration",data:{phone:n,pass:C("#reg-pass").val(),firstname:C("#reg_firstname").val(),birthdate:s,discount:C("#discount").el.checked?1:0,email:C("#reg_email").val(),city:C("#city").val()}})});var i=await o.json();if(a.disabled=!1,hideLoader(),i.status){if(i.data&&i.data.need_confirmation){let e=C("#reg-confirmation-code");hide("#registration_cont"),show("#reg_confirmation"),e.el.scrollIntoView(),e.togclass("fail"),e.el.focus(),setConfirmationTimeout(i)}}else i.description&&showPopup("",i.description)}function setConfirmationTimeout(e){let t=C("#reg_confirmation_remind"),a=C("#reg-confirmation-code-popup"),s=C("#reg_confirmation_info");hide("#confirmation_button_reset"),secondsLeft=e.data.seconds_left,a.text(e.description),s.text(e.description),t.text("Повторная отправка будет доступна через "+secondsLeft+" сек."),secondsInterval&&clearInterval(secondsInterval),secondsInterval=setInterval(()=>{secondsLeft--,t.text("Повторная отправка будет доступна через "+secondsLeft+" сек."),secondsLeft<=0&&(clearInterval(secondsInterval),t.text(""),show("#confirmation_button_reset"))},1e3)}async function confirmation(){let s=C("#reg-confirmation-code"),e=C("#reg-confirmation-code-popup"),n=C("#confirmation_button");if(s.val().length<4)return s.el.scrollIntoView(),s.addclass("fail"),s.el.focus(),void e.togclass("show");if(lastPhone&&s.val()){n.el.disabled=!0,showLoader();let e={method:"confirmation",data:{phone:lastPhone,code:s.val()}},t=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify(e)}),a=await t.json();n.el.disabled=!1,hideLoader(),a.status?(clearLocalStorage(),localStorage.setItem(LS_SECTION,"reg_success"),localStorage.setItem(LS_TOKEN,a.data.token),location.reload()):a.description&&(s.val(""),showPopup("Внимание",a.description))}}async function confirmationReset(){let t=C("#confirmation_button_reset").el;if(lastPhone){t.disabled=!0;var a={method:"confirmationReset",data:{phone:lastPhone}};let e=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify(a)});a=await e.json();t.disabled=!1,a.status&&setConfirmationTimeout(a)}}function canGetResetConfirmationCode(){let e=C("#reset-phone-mask"),t=C("#reset-phone-popup");return e.val().length<16?(e.el.scrollIntoView(),e.addclass("fail"),e.el.focus(),t.togclass("show"),0):1}async function getResetConfirmationCode(){let a=C("#reset-phone-mask"),s=C("#reset_button").el,n=C("#reset_confirmation_info");if(a.val()){s.disabled=!0;var o={method:"getResetConfirmationCode",data:{phone:a.val()}};let e=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify(o)}),t=await e.json();t.status?(show("#reset_confirmation"),n.text(t.description),t.data.seconds_left&&restartResetConfirmationTimer(t.data.seconds_left)):(s.disabled=!1,promiseTimeout(function(){showPopup("Внимание",t.description)},1e3))}}function restartResetConfirmationTimer(e){let t=C("#reset_confirmation_time");resetCodeTimerValue=e-1,show("#reset_confirmation_time"),t.text(resetCodeTimerValue+" сек."),resetCodeTimer&&clearInterval(resetCodeTimer),resetCodeTimer=setInterval(()=>{show("#reset_confirmation_time"),t.text(resetCodeTimerValue+" сек."),--resetCodeTimerValue||(C("#reset_button").el.disabled=!1,hide("#reset_confirmation_time"),resetCodeTimer&&clearInterval(resetCodeTimer))},1e3)}async function checkResetConfirmationCode(){let e=C("#reset-phone"),t=C("#reset_confirmation_code"),a=C("#reset-phone-popup"),s=C("#reset_confirmation_button");if(e.val().length<16)return e.el.scrollIntoView(),e.addclass("fail"),e.el.focus(),void a.togclass("show");if(t.val().length<4)return t.el.scrollIntoView(),t.addclass("fail"),void t.el.focus();s.el.disabled=!0;var n={method:"checkResetConfirmationCode",data:{phone:e.val(),code:t.val()}};let o=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify(n)});n=await o.json();s.el.disabled=!1,n.status?(localStorage.setItem(LS_SECTION,"wallet"),localStorage.setItem(LS_TOKEN,n.data.token),location.reload()):showPopup("Внимание",n.description,null,null,function(){t.val(""),t.el.focus()})}async function getReferLink(){let e=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8",Authorization:"Bearer "+(bearerToken||"")},body:JSON.stringify({method:"getReferLink"})});return await e.json()}function attentionFocus(e){e.scrollIntoView(),e.classList.add("fail"),e.focus(),C("#"+e.id+"-popup").togclass("show")}async function logOff(){let e=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify({method:"logOff"})}),t=await e.json();return t.status&&(clearLocalStorage(),location.reload()),t}async function updateCities(){let a=C("#city");if(!a.el.children.length){let e=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify({method:"getCities"})}),t=await e.json();t.status&&t.data.forEach(e=>{let t=C().create("option");t.val(e.id),t.text(e.title),t.attr("default-discount",e.default_discount),2===e.status&&(t.el.selected="selected"),a.append(t)})}}function dropFail(e){e.value&&e.classList.contains("fail")&&e.classList.remove("fail")}function clearLocalStorage(){localStorage.removeItem(LS_TOKEN),localStorage.removeItem(LS_SECTION)}function loadScript(s){return new Promise(function(e,t){let a=d.createElement("script");a.src=s,a.onload=()=>e(a),a.onerror=()=>t(new Error("Ошибка загрузки скрипта "+s)),d.head.append(a)})}function showTerms(){show("#terms"),C("body").el.style.overflow="hidden",C("#terms").el.getElementsByTagName("iframe")[0].src=TERMS_URL}function showRules(){show("#terms"),C("body").el.style.overflow="hidden",C("#terms").el.getElementsByTagName("iframe")[0].src=RULES_URL}function closeTerms(){hide("#terms"),C("body").el.style.overflow="unset",C("#terms").el.getElementsByTagName("iframe")[0].src=""}function showIndicator(){show("#top-nav-indicator")}function hideIndicator(){hide("#top-nav-indicator")}function showFeedback(){show("#feedback"),d.body.classList.add("hideOverflow")}function hideFeedback(){hide("#feedback"),d.body.classList.remove("hideOverflow")}function showInputPopup(e){let t=C("#"+e);t.el.scrollIntoView(),t.addclass("fail"),t.el.focus(),C("#"+e+"-popup").addclass("show")}function setFeedback(){let e=C("#feedback-phone-mask").val(),t=C("#feedback-message").val(),a=C("#feedback-submit").el;11!==getPhoneNumbers(e).length?showInputPopup("feedback-phone-mask"):t.length<3?showInputPopup("feedback-message"):(a.disabled=!0,showLoader(),API_setFeedback(JSON.stringify({method:"setFeedback",data:{name:C("#feedback-name").val(),phone:C("#feedback-phone-mask").val(),email:C("#feedback-email").val(),reason:C("#feedback-reason").val(),message:C("#feedback-message").val()}})).then(e=>{e.status?(showPopup("Готово","Ваше сообщение передано оператору"),hideFeedback(),C("#feedback-message").val("")):onErrorCatch(e)}).finally(()=>{a.disabled=!1,hideLoader()}))}function API_setFeedback(e){return fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:e}).then(e=>e.json()).catch(e=>({status:!1,description:e.message,error:e}))}function onErrorCatch(e){showPopup("Внимание",e.description),console.warn(e)}function checkUpdates(e,t){!bearerToken&&t&&t(),getUpdates(e).then(e=>{var t,a=localStorage.getItem(LS_SECTION);e.status?(e.data.news.length&&(drawNews(e.data.news),currentUpdates.lastNews=e.data.news.reduce((e,t)=>t.id>e?t.id:currentUpdates.lastNews,currentUpdates.lastNews)),e.data.personalHash&&(drawPersonal(e.data.personal),currentUpdates.personalHash=e.data.personalHash,t=e.data.personal.firstname+" "+e.data.personal.middlename,C("#feedback-name").val(t||""),e.data.personal.city&&(currentCity=e.data.personal.city)),e.data.storesHash&&(drawStores(e.data.stores),currentUpdates.storesHash=e.data.storesHash),e.data.walletHash&&(drawWallet(e.data.wallet),currentUpdates.walletHash=e.data.walletHash),e.data.lastPurchase&&(drawPurchases(e.data.purchases),currentUpdates.lastPurchase=e.data.lastPurchase),e.data.transactions.length&&(currentUpdates.lastTransaction=e.data.transactions[e.data.transactions.length-1].date),sections[a]&&!sections[a].needAuth&&localStorage.setItem(LS_SECTION,"wallet")):sections[a]&&sections[a].needAuth&&logOff()}).finally(()=>{t&&t(),bearerToken&&updateWalletData()})}function getUpdates(e){return fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8",Authorization:"Bearer "+(bearerToken||"")},body:JSON.stringify({method:"getUpdates",data:e,source:SOURCE})}).then(e=>e.json()).catch(e=>({status:!1,description:e.message,error:e}))}async function updateWalletData(){return fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8",Authorization:"Bearer "+(bearerToken||"")},body:JSON.stringify({method:"updateWalletData"})}).then(e=>e.json()).catch(e=>({status:!1,description:e.message,error:e})).finally(()=>{userActivityTimeout=null})}function mask(e){let t=document.createElement("input"),a={};for(var s in a.id=e.id.replace("-mask",""),a.disabled="disabled",a.type=e.getAttribute("type"),a)t.setAttribute(s,a[s]);e.parentNode.insertBefore(t,e),setPhoneMask(e,!1),e.addEventListener("input",e=>setPhoneMask(e.target))}function setPhoneMask(e,t){let a=e.id,s=e.value,n="#"+a.replace("-mask","");t=t||"+_(___)___-__-__",s=getPhoneNumbers(s=""===s?"7":s),C(e).val(getValueByMask(s,t)),C(n).val(getValueByMask(s,t,!0))}function getPhoneNumbers(e){let t=e.replace(/\D/g,"");return t=t?t.replace(/^([^7])/,"7$1").replace(/^(\d{11})(.+)/,"$1"):"7"}function getValueByMask(e,t,a){let s=e.match(/\d/g),n=t;return a=a||!1,s.forEach(e=>n=n.replace(/_/,e)),n=a?n:n.replace(/\)_|-_|_/g,"")}function validateBirthdate(e){let t=!1,a=C("#reg-birthdate-popup"),s=(e.value=e.value.replace(/\D/g,"").replace(/^(\d{2})(\d)/,"$1-$2").replace(/-(\d{2})(\d)/,"-$1-$2").replace(/(\d{4})\d+/,"$1"),e.value.split("-")),n=new Date([s[2],s[1],s[0]].join("/")),o=new Date;return o.getFullYear()-n.getFullYear()<18||"Invalid Date"===n?a.addclass("show"):(a.delclass("show"),t=!0),t}d.addEventListener("DOMContentLoaded",function(){initPopups(),bearerToken=localStorage.getItem(LS_TOKEN),C('input[id*="-mask"]').els.forEach(e=>{mask(e),e.addEventListener("input",e=>{let t=e.currentTarget.value;C('input[id*="-phone-mask"]').els.forEach(e=>{e.value=t,setPhoneMask(e)})})}),C('span[id*="-popup"]').els.forEach(e=>{C("#"+e.id.replace("-popup","")).el.addEventListener("blur",e=>{dropFail(e.target),C("#"+e.target.id+"-popup").delclass("show")})}),C("#auth-button").el.addEventListener("click",e=>auth()),C(".system_tabsHead > span label").els.forEach(e=>{e.addEventListener("click",function(e){let t=e.currentTarget.parentNode,a=t.parentNode.parentNode.children[1].children,s=t.parentNode.children;for(var n=0;n<s.length;n++)s[n].classList.remove("tab_h_active");for(n=0;n<a.length;n++)a[n].classList.remove("tab_c_active");t.classList.add("tab_h_active"),a[t.dataset.tab].classList.add("tab_c_active")})}),C("#reg-birthdate").el.addEventListener("input",e=>validateBirthdate(e.target)),C("#personal_changeCard_button").el.addEventListener("click",()=>changeCard()),C("#personal_changePassword_button").el.addEventListener("click",e=>{changeProfileData()}),C("#set_card").el.addEventListener("click",()=>setCard()),C("#reset_confirmation_code").el.addEventListener("input",e=>{C("#reset_confirmation_button").el.disabled=4!==C("#reset_confirmation_code").val().length}),C("#reg-confirmation-code").el.addEventListener("input",e=>{C("#confirmation_button").el.disabled=4!==C("#reg-confirmation-code").val().length}),C("#personal-new-pass-confirmation").el.addEventListener("input",e=>{C("#personal-new-pass").val()===C("#personal-new-pass-confirmation").val()?C("#personal_changePassword_button").el.disabled=!1:C("#personal_changePassword_button").el.disabled=!0});let e=C('input + i[class^="icon-eye"]').els,t=(e.forEach(e=>{e.addEventListener("click",e=>{let t=e.currentTarget,a=t.parentNode.children[0];a.type="password"===a.type?"text":"password","password"===a.type?(t.classList.remove("icon-eye"),t.classList.add("icon-eye-off")):(t.classList.remove("icon-eye-off"),t.classList.add("icon-eye"))})}),C("#reg-button").el.addEventListener("click",e=>{checkReg()&&showPopup("Подтверждение звонком","Вам позвонят на номер\n"+C("#reg-phone-mask").val(),"На звонок отвечать не требуется, введите последние четыре цифры номера телефона с которого совершён звонок","Запросить звонок",reg)}),C('a[data-click="openBalanceView"]').el.addEventListener("click",e=>{let t=C(".balance-view").el.classList;t.toggle("open"),e.target.innerHTML=t.contains("open")?"Скрыть":"Подробнее..."}),C("#reset_button").el.addEventListener("click",e=>{canGetResetConfirmationCode()&&showPopup("Подтверждение звонком","Ожидайте звонок на номер:\n"+C("#reset-phone-mask").val(),"На звонок отвечать не требуется, введите последние 4-ре цифры номера телефона входящего звонка.","Запросить звонок",getResetConfirmationCode)}),C("#transactions-details-button").el.addEventListener("click",e=>{let t=C("#transactions").el.classList;t.toggle("hidden"),t.contains("hidden")?(e.target.innerText="открыть детализацию",e.target.style.backgroundColor="#4062b7",e.target.style.borderColor="#4062b7"):(e.target.innerText="скрыть детализацию",e.target.style.backgroundColor="#28a960",e.target.style.borderColor="#28a960")}),C("#feedback-submit").el.addEventListener("click",function(){setFeedback()}),C("#store_cities").el.addEventListener("change",e=>{drawStoresInCity(JSON.parse(e.target.options[e.target.selectedIndex].getAttribute("data-stores")))}),C(".bottomNav>li, .mainMenu__content_nav>li").els);t.forEach(e=>{e.addEventListener("click",e=>{e=e.currentTarget.dataset.section;closeNav(),e&&drawSection(e)})}),C("#popupOverlay").el.addEventListener("click",function(e){var t=e.currentTarget.classList;t.remove("animate__fadeIn","animate__fadeOut","animate__animated","animate__furious"),t.add("animate__animated","animate__fadeOut","animate__furious"),e.currentTarget.callback&&(e.currentTarget.callback(),e.currentTarget.callback=null),promiseTimeout(function(){hide("#popupOverlay"),t.remove("animate__fadeIn","animate__fadeOut","animate__animated","animate__furious")},500)}),checkUpdates(currentUpdates,()=>{drawSection(localStorage.getItem(LS_SECTION)),bearerToken&&(d.body.addEventListener("pointerover",userActivity),d.body.addEventListener("pointerdown",userActivity))})});var C=function(e,t){return this.isC=!0,this.isNodeList=function(e){var t=Object.prototype.toString.call(e);return"object"==typeof e&&/^\[object (HTMLCollection|NodeList|Object)\]$/.test(t)&&"number"==typeof e.length&&(0===e.length||"object"==typeof e[0]&&0<e[0].nodeType)},this.isNode=function(e){return!(!e||!e.nodeType)},this.isDocument=function(e){return e instanceof Document||e instanceof Window},this.isclass=function(e){return this.els[0].classList.contains(e)},this.defineEls=function(){return this.isNode(e)||this.isDocument(e)?[e]:this.isNodeList(e)?e:(t&&t.isC&&(t=t.els[0]),(this.isNode(t)?t:document).querySelectorAll(e))},this.defineEl=function(){return this.els[0]},this.els=this.defineEls(),this.el=this.defineEl(),this.on=function(e,i,r,l){var c=this;return this.bind(e,function(e){for(var t=c.isNode(i)||c.isNodeList(i)?i:C(i).els,s=e.target,a=l||!1;s&&s!==this;){if(a){var n=!1;if(C(a).els.forEach(function(e,t,a){e===s&&(n=!0)}),n)break}for(var o=0;o<t.length;o++)if(s===t[o]){r(e,s);break}if(!s)break;s=s.parentNode}}),this},this.attr=function(e,t){if("undefined"===t)return this.el.getAttribute(e);for(var a=0;a<this.els.length;a++)this.els[a].setAttribute(e,t);return this},this.create=function(e){e=document.createElement(e);return this.els=[e],this.el=e,this},this.append=function(e){this.el.append(e.el)},this.style=function(e,t){for(var a=0;a<this.els.length;a++)this.els[a].style[e]=t;return this},this.addclass=function(e){Array.isArray(e)||(e=[e]);for(var t=0;t<this.els.length;t++)for(var a=0;a<e.length;a++)this.els[t].classList.add(e[a]);return this},this.togclass=function(e){for(var t=0;t<this.els.length;t++)this.els[t].classList.toggle(e);return this},this.delclass=function(e){Array.isArray(e)||(e=[e]);for(var t=0;t<this.els.length;t++)for(var a=0;a<e.length;a++)this.els[t].classList.remove(e[a]);return this},this.bind=function(e,t){var a,s;if(!e||!t)return this;if("function"==typeof addEventListener)a=function(e,t,a){e.addEventListener(t,a,!1)};else{if("function"!=typeof attachEvent)return this;a=function(e,t,a){e.attachEvent("on"+t,a)}}if(this.isNodeList(this.els))for(s=0;s<this.els.length;s++)a(this.els[s],e,t);else if(this.isNode(this.els[0])||this.isDocument(this.els[0]))a(this.els[0],e,t);else if(0<this.els.length)for(s=0;s<this.els.length;s++)a(this.els[s],e,t);return this},this.html=function(e){if(!arguments.length&&""!==e)return this.els[0].innerHTML;for(var t=0;t<this.els.length;t++)this.els[t].innerHTML=e;return this},this.text=function(e){if(!arguments.length&&""!==e)return this.els[0].innerText;for(var t=0;t<this.els.length;t++)this.els[t].innerText=e;return this},this.val=function(e){if(!arguments.length&&""!==e)return this.els[0].value;for(var t=0;t<this.els.length;t++)this.els[t].value=e;return this},this instanceof C?this.C:new C(e,t)};