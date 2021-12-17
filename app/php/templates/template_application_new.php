<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <meta name="theme-color" content="#33C3F0" />

  <link rel="manifest" href="manifest.json" />

  <link rel="icon" type="image/png" sizes="192x192" href="app/assets/android-icon-192x192.png" />
  <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="app/assets/apple-icon-180x180.png" />

  <title>Столица.Бонусы</title>

  <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet" />

  <!-- import the webpage's stylesheet -->
  <link rel="stylesheet" href="app/styles/normalize.css" />
  <link rel="stylesheet" href="app/styles/skeleton_new.css" />
  <link rel="stylesheet" href="app/styles/style_241121.min.css" />
  <link rel="stylesheet" href="app/styles/style_desktop.css" media='only screen and (min-width: 1200px)' />
  <link rel="stylesheet" href="app/styles/popups.css" />
  <link rel="stylesheet" href="app/styles/datepicker.min.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />

  <script src="app/js/animate.js"></script>
  <script src="app/js/popups.js"></script>
  <script src="app/js/jquery.min.js"></script>
  <script src="app/js/jquery.mask.min.js"></script>
  <script src="app/js/qrious.min.js"></script>
  <script src="app/js/datepicker.min.js"></script>
  <script src="https://api-maps.yandex.ru/2.1/?apikey=7a895d82-a17c-4fbd-8849-04120c71e5ae&lang=ru_RU&load=Geolink,geolocation,Map,ObjectManager" type="text/javascript"></script>
  <script src="https://yastatic.net/s3/frontend/forms/_/embed.js"></script>

  <script src="app/js/app_081221_01.min.js" defer></script>
</head>

<body>
  <header id="top-nav">
    <i id="top-nav-back" class="material-icons" onclick="routePrevSection()">keyboard_arrow_left</i>
      <i id="top-nav-close" class="material-icons" onclick="routePrevSection()">close</i>
      <i id="top-nav-msg" class="fa fa-envelope-o" aria-hidden="true" onclick="feedback.style.display='';closeNav()"></i>
    <h6 id="top-nav-title"></h6>
    <i id="top-nav-menu" class="fa fa-bars" onclick="openNav()"></i>
  </header>

  <div id="loader">
    <div class="lds-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>

  <div id="overlay" style="display: none;">
    <div id="popupCont">
      <h4 id="popupTitle"></h4>
      <div class="gridstone">
        <hr>
        </hr>
        <hr>
        </hr>
        <hr>
        </hr>
      </div>
      <h6 id="popupDescription"></h6>
      <p id="popupMessage"></p>
      <button id="popupButton" class="button-primary"></button>
    </div>
  </div>

  <div id="feedback" style="display: none;">
    <a href="javascript:void(0)" class="closebtn" onclick="feedback.style.display = 'none';">&times;</a>
    <iframe loading="lazy" id="feedback_form" style="width: 90vw; align-self: center; justify-self: center;" src="https://forms.yandex.ru/u/60739246c794ed6852e13244/?iframe=1" frameborder="0" name="ya-form-60739246c794ed6852e13244" phone=""></iframe>
  </div>

  <div id="rules_ref" class="terms" style="display: none">
      <iframe loading="lazy" src="pravila-ref" frameborder="0"></iframe></iframe>
      <div class="commands">
          <button onclick='rules_ref.style.display = "none";'>Принять</button>
      </div>
  </div>

  <div id="rules" class="terms" style="display: none">
    <iframe loading="lazy" src="pravila" frameborder="0"></iframe>
    <div class="commands">
      <button onclick='rules.style.display = "none";'>Принять</button>
    </div>
  </div>

  <div id="terms" class="terms" style="display: none">
    <iframe loading="lazy" src="politika-konfidentsialnosti" frameborder="0"></iframe>
    <div class="commands">
      <button onclick='terms.style.display = "none";'>Принять</button>
    </div>
  </div>

  <div id="topnav" class="overlay">
    <div class="topnav-top">
      <a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>
      <span class="topnav-top-title">Меню</span>
      <i id="top-nav-menu" class="fa fa-bars" onclick="closeNav()"></i>
    </div>
    <div class="overlay-content">
      <div class="bottom-nav-element" section="wallet" onclick="closeNav()">Кошелек</div>
      <div class="bottom-nav-element" section="news" onclick="closeNav()">Акции</div>
      <div class="bottom-nav-element" section="stores" onclick="closeNav()">Магазины</div>
      <div class="bottom-nav-element" section="personal" onclick="closeNav()">Профиль</div>
      <div class="bottom-nav-element" section="refer" onclick="closeNav()">Пригласить друга</div>
    </div>
    <div class="topnav-bottom">
      <div class="topnav-bottom-feedback" onclick="feedback.style.display='';closeNav()">
        <i class="fa fa-question" aria-hidden="true" style="color: #bbb;"></i>
        <span>Задать вопрос</span>
      </div>
      <div class="topnav-bottom-feedback" onclick="logOff()">
        <i class="fa fa-sign-out" aria-hidden="true" style="color: #fff"></i>
        <span>Выход</span>
      </div>
    </div>
  </div>

  <div class="main-app-space">
    <div id="adult" class="section" style="display: none;">
      <h2 class="main-logo"></h2>
      <div class="container">
        <h5 class="hero-heading">
          Подтвердите, что Вам есть 18 лет
        </h5>
        <button class="button button-primary" style="width: 100%;" onclick="drawSection('intro')">мне исполнилось 18 лет</button>
        <button class="button button-leave" style="width: 100%;">мне нет 18 лет</button>
        <!-- <div class="info">Для вашего удобства сайт работает с файлами cookie - заходя на данный ресурс, вы соглашаетесь на их использование.</div>-->
      </div>
    </div>

    <div id="intro" class="section" style="display: none;">
      <h2 class="main-logo"></h2>
      <div class="container">
        <!-- <h6 style="color: gray;">Войдите, если у Вас логин и пароль или зарегистрируйтесь, если Вы еще не с нами</h6> -->
        <button class="button button-primary" style="width: 100%;" onclick="drawSection('authorization')" id="auth_button">Войти</button>
        <div class="gridstone">
          <hr>
          </hr>
          <div>или</div>
          <hr>
          </hr>
        </div>
        <p style="font-size: 1.3rem;"><a href="#" onclick="drawSection('pre-registration')">Зарегистрироваться</a></p>
      </div>
    </div>

    <div id="authorization" class="section" style="display: none;">
      <div class="container">
        <p class="hero-heading">Введите ваш номер телефона и пароль</p>
        <!-- Номер телефона -->
        <div class="popup"><span class="popup-text" id="auth_phone_popup">Введите номер телефона</span></div>
        <input class="u-full-width" type="text" placeholder="+7-___-___-__-__" id="auth_phone" />
        <!-- Пароль -->
        <div class="popup"><span class="popup-text" id="auth_pass_popup">Введите пароль</span></div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr;">
          <input class="u-full-width" style="grid-area: 1/1/1/4;" type="password" placeholder="Пароль" id="auth_pass" />
          <i id="auth_pass_toggle" class="material-icons" style="grid-area: 1/3/1/4; align-self: center; justify-self: right; width: 40px; height: 40px;">remove_red_eye</i>
        </div>
        <!-- Кнопки -->
        <p style="text-align: right;"><a style="font-size: 1.3rem;" href="#" onclick="drawSection('reset')">Забыли пароль?</a></p>
        <button class="button button-primary" style="width: 100%;" onclick="auth()" id="auth_button">Войти</button>
        <p style="font-size: 1.3rem;">
          <span>У вас ещё нет аккунта?</span>
          <a href="#" onclick="drawSection('pre-registration')">Зарегистрироваться</a>
        </p>
      </div>
    </div>

    <div id="reset" class="section" style="display: none;">
      <div class="container">
        <h3>Не удается войти?</h3>
        <i class="material-icons" style="font-size: 48px">no_encryption</i>
        <p class="hero-heading">Введите ваш номер мобильного телефона</p>
        <div class="popup"><span class="popup-text" id="reset_phone_popup">Введите номер телефона</span></div>
        <input class="u-full-width" type="text" placeholder="+7-___-___-__-__" id="reset_phone" />
        <button class="button button-primary" style="width: 100%;" id="reset_button">Получить код для входа</button>
        <!-- Блок подтверждения входа -->
        <div id="reset_confirmation" style="display: none;">
          <div id="reset_confirmation_info" style="font-weight: bold;"></div>
          <input class="u-full-width" type="number" placeholder="Код" id="reset_confirmation_code" />
          <p id="reset_confirmation_time" class="neutral" style="display: none;"></p>
          <p style="font-size: 1.3rem;">
            <span>Мне не позвонили,</span>
            <a href="#" onclick="feedback.style.display=''">что мне делать?</a>
          </p>
          <button class="button button-primary" style="width: 100%;" onclick="checkResetConfirmationCode()" id="reset_confirmation_button" disabled>Войти</button>
        </div>
        <div class="gridstone">
          <hr>
          </hr>
          <div>или</div>
          <hr>
          </hr>
        </div>
        <p style="font-size: 1.3rem;">
          <a href="#" onclick="drawSection('pre-registration')">Создать новый аккаунт</a>
        </p>
      </div>
    </div>

    <div id="pre-registration" class="section" style="display: none;">
      <h2 class="main-logo"></h2>
      <div class="container">
        <img src="app/assets/city.png">
        <p>Выберите город</p>
        <select id="city" name="card_discount" class="reg_city"></select>
        <p style="font-size: 1.3rem;">
          <button class="button button-primary" style="width: 100%;" onclick="drawSection('registration')">Готово</button>
        </p>
      </div>
    </div>

    <div id="registration" class="section" style="display: none;">
      <div class="container">
        <!-- Блок регистрации -->
        <div id="registration_cont" class="row">
          <p class="hero-heading">Для завершения регистрации укажите свои контактные данные</p>
          <div class="reg_inp">
            <input class="u-full-width" type="text" placeholder="Имя" id="reg_firstname" />
          </div>
          <!-- Тип карты -->
          <!-- <div class="card_block">-->
          <!--     <label style="text-align: left;" for="reg_card_type_digital"><input type="radio" name="card_type" id="reg_card_type_digital" value="digital" checked> Виртуальная карта</label>-->
          <!--     <label style="text-align: left;" for="reg_card_type_analog"><input type="radio" name="card_type" id="reg_card_type_analog" value="analog"> Пластиковая карта</label>-->
          <!-- </div>-->
          <!-- Номер телефона -->
          <div class="popup"><span class="popup-text" id="reg_phone_popup">Введите номер телефона</span></div>
          <div class="reg_inp required">
            <input class="u-full-width required" type="text" placeholder="+7-___-___-__-__" id="reg_phone" />
          </div>
          <div class="popup"><span class="popup-text" id="reg_birthdate_popup">Введите дату рождения</span></div>
          <div class="reg_inp required">
            <input class="u-full-width" data-date-format="dd-mm-yyyy" type="text" placeholder="__-__-____" id="reg_birthdate" />
          </div>
          <!-- Номер бонусной карты -->
          <!-- <div id="reg_card_number_group">
          <div class="popup"><span class="popup-text" id="reg_cardNumber_popup">Отсканируйте номер бонусной карты</span></div>
            <input class="u-full-width" type="text" placeholder="Номер бонусной карты" id="reg_cardNumber" />
          </div> -->
          <!-- Прочие свойства -->
          <!-- <input class="u-full-width" type="email" placeholder="Email" id="reg_email" />-->
          <!-- <input class="u-full-width" type="text" placeholder="Отчество" id="reg_middlename" />-->
          <!-- <input class="u-full-width" type="text" placeholder="Фамилия" id="reg_lastname" />-->
          <!-- Дата рождения -->
          <div class="reg_inp">
            <input class="u-full-width" type="email" placeholder="e-mail" id="reg_email" />
          </div>
          <!-- Пароль -->
          <div class="popup"><span class="popup-text" id="reg_pass_popup">Введите пароль, не менее 6 символов</span></div>
          <div id="reg_password_group" class="reg_inp required" style="display: grid; grid-template-columns: 1fr 1fr 1fr;">
            <input class="u-full-width" style="grid-area: 1/1/1/4;" type="password" placeholder="Пароль" id="reg_pass" />
            <i id="reg_pass_toggle" class="material-icons" style="grid-area: 1/3/1/4; align-self: center; justify-self: right; width: 40px; height: 40px;">remove_red_eye</i>
          </div>
          <div id="reg_password_group" class="reg_inp required" style="display: grid; grid-template-columns: 1fr 1fr 1fr;">
            <input class="u-full-width" style="grid-area: 1/1/1/4;" type="password" placeholder="Повторите пароль" id="reg_pass_confirm" />
            <i id="reg_pass_toggle_confirm" class="material-icons" style="grid-area: 1/3/1/4; align-self: center; justify-self: right; width: 40px; height: 40px;">remove_red_eye</i>
          </div>
          <!-- <p>Какая карта Ваша?</p>-->
          <!-- <div class="card_block">-->
          <!--     <label style="text-align: left;" for="reg_card_type_prem"><input type="radio" name="card_discount" id="reg_card_type_prem" value="0" checked> Премиум (скидки до 45%, кэшбек бонусными рублями)</label>-->
          <!--     <label style="text-align: left;" for="reg_card_type_discount"><input type="radio" name="card_discount" id="reg_card_type_discount" value="1"> Дисконтная карта (скидки до 10%)</label>-->
          <!-- </div>-->
          <!-- Выбор города -->
          <!-- <label for="reg_sex">Пол</label>-->
          <!-- <select class="u-full-width" id="reg_sex">-->
          <!--   <option value="0">Не выбран</option>-->
          <!--   <option value="1">Мужской</option>-->
          <!--   <option value="2">Женский</option>-->
          <!-- </select>-->
          <!-- Подписка на события -->
          <!-- <input id="subscribe" type="radio" name="subscribe" value="1" checked>
          <label for="subscribe" class="subscribe_info"><span>Я хочу получать уведомления об акциях, новинках, сообщениях. Сменить <a>подписки и уведомления</a> можно в <a>настройках</a></span></label>
          <span class="required-desc">* поля обязательные к заполнению</span>
          <hr> -->
          <!-- Система скидок -->
          <div id="loyalty-system" class="system system-reg">
            <p class="system_title">Выберите систему скидок</p>
            <div class="system_tabs">
              <div class="system_tabs-head">
                <span class="system_tabs-head-item tab_h_active"><input id="prem" type="radio" name="system" value="0" checked><label for="prem">Бонусная <br> скидки до 50%</label></span>
                <span class="system_tabs-head-item"><input id="discount" type="radio" name="system" value="1"><label for="discount">Дисконтная</label></span>
              </div>

              <div class="system_tabs-content">
                <div class="system_tabs-content-item tab_c_active"><span>Кэшбек бонусами до 15%, бонусы в подарок, 2000 бонусов в подарок при регистрации.</span></div>
                <div class="system_tabs-content-item"><span>Вы можете получать скидки от 5% до 10% на товар, который можно приобрести со скидкой.</span></div>
              </div>
            </div>
          </div>

          <!-- Согласие с условиями -->
          <p class="reg_confirm">Создавая аккаунт, я соглашаюсь с <a onclick="rules.style.display=''">правилами</a> и даю согласие на <a onclick="terms.style.display=''">обработку персональных данных</a>.</p>
          <!-- Кнопка регистрации -->
          <button class="button button-primary" style="width: 100%;" id="reg_button">Создать аккаунт</button>
        </div>
        <!-- Блок подтверждения регистрации -->
        <div id="reg_confirmation" style="display: none;">
          <div id="reg_confirmation_info"></div>
          <div id="reg_confirmation_remind"></div>
          <div class="popup"><span class="popup-text" id="reg_confirmation_code_popup"></span></div>
          <input class="u-full-width" type="number" placeholder="Код" id="reg_confirmation_code" />
          <button class="button button-primary" style="width: 100%;" onclick="confirmation()" id="confirmation_button">Подтвердить</button>
          <button class="button button-primary" style="width: 100%; display: none" onclick="confirmationReset()" id="confirmation_button_reset">Получить СМС</button>
        </div>
        <!-- Авторизация -->
        <p class="reg_auth" style="font-size: 1.3rem;">
          <span>Постойте, но ведь</span>
          <a href="#" onclick="drawSection('authorization')">я уже зарегистрирован</a>
        </p>
      </div>
    </div>

    <div id="reg_success" class="section" style="display: none;">
      <div class="reg_success-top">
        <div class="container">
          <div class="reg_success-top-block">
            <img src="app/assets/success-reg.png">
            <p>Ваша ВИРТУАЛЬНАЯ карта готова к использованию! Для использования перейдите в <a href="#" onclick="drawSection('wallet')">КОШЕЛЕК</a> и предьявите QR-код продавцу.</p>
            <p> ПЛАСТИКОВАЯ карта больше не нужна!</p>
            <p> Если вам не удобно пользоваться виртуальной картой, вы можете получить пластиковую карту в <a href="#" onclick="drawSection('stores')">любом магазине</a>. </p>
          </div>
        </div>
      </div>
      <div class="reg_success-bottom">
        <div class="container">
          <button class="button" style="width: 100%;" onclick="drawSection('wallet')">Перейти в кошелек</button>
        </div>
      </div>
    </div>

    <div id="personal" class="section personal" style="display: none;">
      <div class="personal__top">
        <div class="personal__top-avatar">
          <img src="app/assets/avatar.png">
        </div>
        <div class="personal__top-name">
          <span id="personal_name" class="neutral" style="color: #616161;">Наш Любимый Покупатель</span>
        </div>
        <div class="personal__top-birthdate">
          <hr class="personal__hr-one">
          <span id="personal_birthdate" class="neutral"></span>
          <hr class="personal__hr-two">
        </div>
        <div class="personal__top-phone">
          <span id="personal_phone" class="neutral" style="color: #616161;">+7-___-___-__-__</span>
        </div>
      </div>
      <div class="container">
        <div class="personal__bottom">
          <p class="personal__bottom-level-title">Ваша карта</p>
          <div class="personal__bottom-level">
            <img src="/app/assets/level-bg.png">
            <span id="personalCardType" class="level"></span>
          </div>
            <div id="notMatchCardType" style="display: none; font-size: 18px;color: #616161;margin-top: 40px">
              Завтра Ваша карта станет <span id="notMatchCardTypeValue"></span>
            </div>
          <div class="personal__bottom-event">
            <button class="button-white" onclick="drawSection('personal_update')">сменить данные</button>
          </div>
        </div>
      </div>
    </div>

    <div id="personal_update" class="section personal-update" style="display: none;">
      <div class="container">
        <div id="replace_card" style="display: none">
          <p class="hero-heading">Переход на пластиковую карту:</p>
          <div class="popup"><span class="popup-text" id="personal_new_card_popup">Введите номер карты</span></div>
          <input class="u-full-width" type="text" placeholder="Номер карты" id="personal_new_card" popup_id="personal_new_card_popup" />
          <button id="personal_changeCard_button" class="button-primary">Подтвердить</button>
        </div>
        <div class="set_plastic-top">
          <a href="#" onclick="drawSection('set_plastic')">Привязать пластиковую карту</a>
          <p>Пластиковую карту можно получить в магазине.</p>
          <a href="#" onclick="drawSection('stores')">Найти магазин.</a>
        </div>
        <p class="hero-heading text-center">Изменить пароль</p>
        <div class="popup"><span class="popup-text" id="personal_new_pass_popup">Введите новый пароль</span></div>
        <div class="update__pass">
          <input class="u-full-width" type="password" placeholder="введите новый пароль" id="personal_new_pass" popup_id="personal_new_pass_popup" />
          <i id="update_pass_toggle" class="material-icons" style="grid-area: 1/3/1/4; align-self: center; justify-self: right; width: 40px; height: 40px;">remove_red_eye</i>
        </div>
        <div class="popup"><span class="popup-text" id="personal_new_pass_confirmation_popup">Введенные пароли не совпадают</span></div>
        <div class="update__pass">
          <input class="u-full-width" type="password" placeholder="повторите новый пароль" id="personal_new_pass_confirmation" popup_id="personal_new_pass_confirmation_popup" />
          <i id="update_pass_toggle_confirm" class="material-icons" style="grid-area: 1/3/1/4; align-self: center; justify-self: right; width: 40px; height: 40px;">remove_red_eye</i>
        </div>
      </div>

      <div class="personal-update-system">
        <div class="container">
          <p class="hero-heading text-center" style="margin-top: 0px;text-transform: uppercase">Выберите тип карты</p>
          <div class="system system-update">
            <div class="system_tabs">
              <div class="system_tabs-head">
                <span class="system_tabs-head-item-change tab_h_active"><input id="premChange" type="radio" name="systemChange" value="0" checked><label for="premChange">Бонусная</label></span>
                <span class="system_tabs-head-item-change"><input id="discountChange" type="radio" name="systemChange" value="1"><label for="discountChange">Дисконтная</label></span>
              </div>

              <div class="system_tabs-content">
                <div class="system_tabs-content-item-change tab_c_active"><span>С покупок Вы получаете кэшбек бонусными рублями. Свои скидки Вы сможете смотреть в личном кабинете.</span></div>
                <div class="system_tabs-content-item-change"><span>Вы можете получать скидки от 5% до 10% на товар, который можно приобрести со скидкой.</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="container">
          <p style="text-align: center;font-size: 13px;">Сменить вид программы Вы можете один раз в сутки. <a onclick="rules.style.display=''">Подробнее</a></p>
          <button id="personal_changePassword_button" class="button-primary" style="width: 100%;">Внести изменения</button>
        </div>
      </div>
    </div>

    <div id="set_plastic" class="section" style="display: none;">
      <div class="container">
        <div class="set_plastic-top">
          <span>Привязать пластиковую карту</span>
          <p>Пластиковую карту можно получить в магазине.</p>
          <a href="#" onclick="drawSection('stores')">Найти магазин.</a>
        </div>
        <div class="set_plastic-bottom">
          <button id="scanerQR"><span class="scan_text">Просканируйте QR-код,<br> Что бы привязать карту</span>
            <div class="scan_focus">
              <div class="scan_focus-block"><span class="scan_focus-item1"></span><span class="scan_focus-item2"></span><span class="scan_focus-item3"></span><span class="scan_focus-item4"></span><span class="scan_focus-item5"></span></div>
            </div><span class="scan_border1"></span><span class="scan_border2"></span><span class="scan_border3"></span><span class="scan_border4"></span>
          </button>
          <input type="text" id="plasticNumber" placeholder="номер карты">
          <button id="set_card" class="button-primary plastic-add">Добавить</button>
        </div>
      </div>
    </div>

    <div id="news" class="section news" style="display: none;">
      <div class="container">
        <!-- <div class="news">
          <div class="news-img">
            <img class="news-picture" loading="lazy" src="app/assets/news/sales.jpg" />
          </div>
          <div class="news-info">
            <div class="news-date">27 октября 2021</div>
            <div class="news-title">Щедрые осенние скидки до 44% в Столице!</div>
            <div class="news-description">
              <p>Осень пришла, а это значит у нас новый каталог! Более 120 видов напитков по ЩЕДРЫМ ценам, порадуйте себя и близких. Акция действует до 15 ноября 2021 года в магазинах «Столица».</p>
            </div>
            <a href="/pravila" class="news-show">Подробнее</a>
          </div>
        </div> -->
        <div class="news">
          <div class="news-img">
            <img class="news-picture news-img" loading="lazy" src="app/assets/news/new-program.jpg" />
          </div>
          <div class="news-info">
            <div class="news-date">27 октября 2021</div>
            <div class="news-title">Новая программа лояльности в магазинах «Столица».</div>
            <div class="news-description">
                <p>Действие новой программы лояльности в магазинах «Столица» с 26 ноября 2021 года. С условиями использования карт можно ознакомиться по <a onclick="rules.style.display=''">ссылке</a>. Бонусы от «Столицы» — это выгодно!</p>
            </div>
            <!-- <a href="/pravila" class="news-show">Подробнее</a> -->
          </div>
        </div>
          <div class="news">
              <div class="news-img">
                  <img class="news-picture news-img" loading="lazy" src="app/assets/news/refer.jpg" />
              </div>
              <div class="news-info">
                  <div class="news-date">27 октября 2021</div>
                  <div class="news-title">Приглашайте друзей и получайте бонусы!</div>
                  <div class="news-description">
                      <p>Приглашайте друзей в программу лояльности и получайте целую 1 000 бонусов! Количество друзей неограниченно! Акция действует по 31 декабря 2021 года. <a href="#" onclick="rules_ref.style.display=''">Подробные условия акции</a>.</p>
                  </div>
                  <!-- <a href="/pravila" class="news-show">Подробнее</a> -->
              </div>
          </div>
          <div class="news">
              <div class="news-img">
                  <img class="news-picture news-img" loading="lazy" src="app/assets/news/sale1.jpg" />
              </div>
              <div class="news-info">
                  <div class="news-date">19 ноября 2021</div>
                  <div class="news-title">Армянские плодово-ягодные вина «Шахназарян» по соблазнительной цене!</div>
                  <div class="news-description">
                      <p>С 3 ноября по 30 ноября успейте приобрести армянские плодово-ягодные вина по цене 319,97 рублей!</p>
                      <p>В акции участвуют:</p>
                            <ul>
                                <li>Вино фрукт. «Вишневое вино», 0,75 л, п/сл,</li>
                                <li>Вино фрукт. «Гранатовое вино», 0,75 л, п/сл,</li>
                                <li>Вино фрукт. «Ежевичное вино», 0,75 л, п/сл,</li>
                                <li>Вино фрукт. «Малиновое вино», 0,75 л, п/сл.</li>
                            </ul>
                      <p>Срок проведения акции: 03.11.2021 - 30.11.2021 года.</p>
                      <p>Количество товаров ограничено.</p>
                      <p>Акция проходит на территории магазинов, использующих товарный знак "Столица" По лицензионному договору.</p>
                  </div>
              </div>
          </div>
          <div class="news">
              <div class="news-img">
                  <img class="news-picture news-img" loading="lazy" src="app/assets/news/sale2.jpg" />
              </div>
              <div class="news-info">
                  <div class="news-date">19 ноября 2021</div>
                  <div class="news-title">Акция на линейку фруктовых вин «Финберри».</div>
                  <div class="news-description">
                      <p>Фруктовые вина «Финберри» со скидкой 35% уже в магазинах «Столица»</p>
                      <p>В акции участвуют:</p>
                      <ul>
                          <li>Вино фрукт. «Вишня», 0,5 л, п/сл,</li>
                          <li>Вино фрукт. «Клюква», 0,5 л, п/сл,</li>
                          <li>Вино фрукт. «Клубника», 0,5 л, п/сл,</li>
                      </ul>
                      <p>Срок проведения акции: 18.11.2021 - 31.12.2021 года.</p>
                      <p>Количество товаров ограничено.</p>
                      <p>Акция проходит на территории магазинов, использующих товарный знак "Столица" По лицензионному договору.</p>
                  </div>
              </div>
          </div>
          <div class="news">
              <div class="news-img">
                  <img class="news-picture news-img" loading="lazy" src="app/assets/news/sale3.jpg" />
              </div>
              <div class="news-info">
                  <div class="news-date">19 ноября 2021</div>
                  <div class="news-title">Линейка фруктовых вин «Лимберг» со скидкой 35% в магазинах «Столица».</div>
                  <div class="news-description">
                      <p>Во всех магазинах «Столица» скидки 35% на фруктовые вина линейки «Лимберг».</p>
                      <ul>
                          <li>Вино фрукт. «Лесные ягоды», 0,5 л, п/сл,</li>
                          <li>Вино фрукт. «Персик», 0,5 л, п/сл,</li>
                          <li>Вино фрукт. «Вишня», 0,5 л, п/сл,</li>
                      </ul>
                      <p>Срок проведения акции: 18.11.2021 - 31.12.2021 года.</p>
                      <p>Количество товаров ограничено.</p>
                      <p>Акция проходит на территории магазинов, использующих товарный знак "Столица" По лицензионному договору.</p>
                  </div>
              </div>
          </div>
      </div>
    </div>

    <div id="wallet" class="section wallet" style="display: none;">
      <div class="wallet__top">
        <div class="container">
          <div id="cardType"></div>
          <div id="qrcode" style="display: none;"></div>
          <div style="display: none">Ваш персональный код:</div>
          <div style="display: none">
            <span id="cardNumber" class="neutral">Загрузка..</span>
          </div>
          <button id="downloadCard" style="display: none">Скачать QR код</button>
          <h5 class="balance-text">
            <i class="material-icons neutral" style="vertical-align: middle;color: #28a960;">account_balance_wallet</i>
            <span class="balance-text-text" id="cardInfo">БАЛАНС</span>
            <span class="balance-text-hr"></span>
            <div class="balance-text-result">
              <span id="bonuses" style="font-weight: bold; color: #4062b7;" class="load">Загрузка..</span>
              <span id="currencyType">бонусов</span>
            </div>
          </h5>
        </div>
      </div>
      <div class="wallet__bottom">
        <div id="cardDataDiscount" style="display: none">
          <div>С бонусами выгоднее!</div>
          <div>Переходи на бонусы,</div>
          <div>получай скидки до 50% и кэшбек до 15%!</div>
          <a href="#" onclick="drawSection('personal_update')">Хочу бонусную карту!</a>
        </div>
        <div id="cardDataBonus" style="display: none">
          <span>Пока мы не запустили бонусную программу,<br> Ваша скидка <span id="discountValue"></span>. <br>О начале действия бонусной программы мы сообщим дополнительно и Вы сможете поспользоваться Вашими бонусами.</span>
        </div>
        <div id="cardDataBonusPreffered" style="display: none">
          <span>Бонусная карта, переход на дисконтную(заглушка).</span>
        </div>
        <p id="changeDiscountSystem" style="display: none; font-size: 18px;color: #616161;margin-top: 40px">
          <span>Завтра Ваша карта станет <span id="changeDiscountSystemValue"></span>.</span>
        </p>
        <button id="transactions-details-button" class="details button-primary">Открыть детализацию</button>
        <div id="transactions" style="display: none; margin: 0 16px;">
          <div class="container">
            <!-- Детализация -->
          </div>
        </div>
      </div>
    </div>

    <div id="stores" class="section stores" style="display: none;">
      <div class="container">
        <div class="storeHead">
          <img src="app/assets/city.png">
          <p>Выберите город</p>
          <select id="store_cities" name="store_cities" class="reg_city"></select>
        </div>
        <div id="storesList">

        </div>
      </div>
    </div>

    <div id="refer" class="section refer" style="display: none;">
      <div class="container">
        <div id="referQr"></div>
        <h3>Хочешь еще бонусов?</h3>
        <p>Пригласи друга и получи дополнительные <strong>1000</strong> бонусов!</p>
        <p>Отправь другу ссылку на регистрацию и получи <strong>1000</strong> бонусов на свой счет после его первой покупки в магазине «Столица»*</p>
        <p>Количество ссылок не ограничено, больше друзей – больше бонусов!</p>
        <p><small>*Бонусы начисляются после первой совершенной покупки другом.</small></p>
        <p style="font-size: 1.3rem;">
          <a href="/pravila-akcii">Полные правила акции</a>
        </p>
        <p>Отсканируйте QR код с другого устройства, либо поделитесь ссылкой с друзьями:</p>
        <p id="referLink" style="display: none">
          <a id="referLinkWA" href=""><img style="width: 64px;" loading="lazy" src="app/assets/social/whatsapp-128x128.png" alt="WHATSAPP"></a>
          <a id="referLinkTG" href=""><img style="width: 64px;" loading="lazy" src="app/assets/social/telegram-128x128.png" alt="TELEGRAM"></a>
        </p>
        <p>История отправленных приглашений:</p>
        <table class="u-full-width" style="font-size: 1.1rem;">
          <tbody id="referrals">
          </tbody>
        </table>
      </div>
    </div>

    <div id="alerts" class="section" style="display: none;">
      <div class="alerts_block">
        <div class="alerts_block-item">
          <span>Push-уведомления</span>
          <div class="switcher">
            <input id="push-sw" type="checkbox" /><label class="toggle" for="push-sw"><span class="toggle--handler"></span></label>
          </div>
        </div>
        <div class="alerts_block-item">
          <span>Email</span>
          <div class="switcher">
            <input id="email-sw" type="checkbox" /><label class="toggle" for="email-sw"><span class="toggle--handler"></span></label>
          </div>
        </div>
        <div class="alerts_block-item">
          <span>SMS</span>
          <div class="switcher">
            <input id="sms-sw" type="checkbox" /><label class="toggle" for="sms-sw"><span class="toggle--handler"></span></label>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer id="bottomnav" style="display: none;">
    <div class="bottom-nav-element" section="news">
      <i class="material-icons">local_offer</i>
      <div>Акции</div>
    </div>
    <div class="bottom-nav-element" section="stores">
      <i class="material-icons">map</i>
      <div>Карты</div>
    </div>
    <div class="bottom-nav-element" section="wallet">
      <i class="material-icons">credit_card</i>
      <div>Кошелек</div>
    </div>
    <div class="bottom-nav-element" section="personal">
      <i class="material-icons">assignment_ind</i>
      <div>Профиль</div>
    </div>
  </footer>

  <!-- Yandex.Metrika counter -->
  <script type="text/javascript" >
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    ym(75982831, "init", {
          clickmap:true,
          trackLinks:true,
          accurateTrackBounce:true
    });
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/75982831" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
  <!-- /Yandex.Metrika counter -->
</body>

</html>