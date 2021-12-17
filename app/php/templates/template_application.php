<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <meta name="theme-color" content="#33C3F0"/>

  <link rel="manifest" href="manifest.json" />

  <link rel="icon" type="image/png" sizes="192x192"
    href="app/assets/android-icon-192x192.png" />
  <link rel="apple-touch-icon" type="image/png" sizes="180x180"
    href="app/assets/apple-icon-180x180.png" />

  <title>Столица: Лояльность</title>

  <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet" />

  <!-- import the webpage's stylesheet -->
  <link rel="stylesheet" href="app/styles/normalize.css" />
  <link rel="stylesheet" href="app/styles/skeleton.css" />
  <link rel="stylesheet" href="app/styles/style_31082102.min.css" />
  <link rel="stylesheet" href="app/styles/style_desktop.css" media='only screen and (min-width: 1200px)'/>
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
  <script src="https://api-maps.yandex.ru/2.1/?apikey=7a895d82-a17c-4fbd-8849-04120c71e5ae&lang=ru_RU&load=Geolink,geolocation" type="text/javascript"></script>
  <script src="https://yastatic.net/s3/frontend/forms/_/embed.js"></script>

  <script src="app/js/app_111021.min.js" defer></script>
</head>

<body>
  <header id="top-nav">
    <i id="top-nav-back" class="material-icons" onclick="routePrevSection()">keyboard_arrow_left</i>
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
      <div class="gridstone"><hr></hr><hr></hr><hr></hr></div>
      <h6 id="popupDescription"></h6>
      <p id="popupMessage"></p>
      <button id="popupButton" class="button-primary"></button>
    </div>
  </div>

  <div id="feedback" style="display: none;">
    <a href="javascript:void(0)" class="closebtn" onclick="feedback.style.display = 'none';">&times;</a>
    <iframe id="feedback_form" style="width: 90vw; align-self: center; justify-self: center;" src="https://forms.yandex.ru/u/60739246c794ed6852e13244/?iframe=1" frameborder="0" name="ya-form-60739246c794ed6852e13244" phone=""></iframe>
  </div>

  <div id="rules" class="terms" style="display: none">
    <iframe src="pravila" frameborder="0"></iframe>
    <div class="commands">
      <button onclick='rules.style.display = "none";'>Принять</button>
    </div>
  </div>

  <div id="terms" class="terms" style="display: none">
    <iframe src="politika-konfidentsialnosti" frameborder="0"></iframe>
    <div class="commands">
      <button onclick='terms.style.display = "none";'>Принять</button>
    </div>
  </div>

  <div id="topnav" class="overlay">
    <a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>
    <div class="overlay-content">
      <div class="bottom-nav-element" section="wallet" onclick="closeNav()">Кошелек</div>
      <div class="bottom-nav-element" section="news" onclick="closeNav()">Акции</div>
      <div class="bottom-nav-element" section="stores" onclick="closeNav()">Магазины</div>
      <div class="bottom-nav-element" section="personal" onclick="closeNav()">Профиль</div>
      <div class="bottom-nav-element" section="refer" onclick="closeNav()">Пригласить</div>
      <div class="bottom-nav-element" onclick="logOff()">Выход</div>
    </div>
  </div>

  <div class="main-app-space">
    <div id="adult" class="section" style="display: none;">
      <div class="container">
        <h1 class="hero-heading" style="font-weight: bold">18+</h1>
        <h5 class="hero-heading">
          Данное предложение содержит информацию, не рекомендованную для лиц,
          не достигших совершеннолетнего возраста. Для доступа к приложению
          подтвердите, пожалуйста, своё совершеннолетие.
        </h5>
        <button class="button button-primary" style="width: 100%;" onclick="drawSection('intro')">Подтвердить и войти</button>
        <div class="info">Для вашего удобства сайт работает с файлами cookie - заходя на данный ресурс, вы соглашаетесь на их использование.</div>
      </div>
    </div>

    <div id="intro" class="section" style="display: none;">
      <div class="container">
        <h2 class="main-logo"></h2>
        <h6 style="color: gray;">Зарегистрируйтесь, чтобы участвовать в нашей бонусной программе.</h6>
        <button class="button button-primary" style="width: 100%;" onclick="drawSection('authorization')" id="auth_button">Войти</button>
        <div class="gridstone">
          <hr></hr>
          <div>или</div>
          <hr></hr>
        </div>
        <p style="font-size: 1.3rem;"><a href="#" onclick="drawSection('registration')">Зарегистрироваться по номеру телефона</a></p>
      </div>
    </div>

    <div id="authorization" class="section" style="display: none;">
      <div class="container">
        <p class="hero-heading">Введите ваш номер мобильного телефона и пароль</p>
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
          <a href="#" onclick="drawSection('registration')">Зарегистрироваться</a>
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
          <hr></hr>
          <div>или</div>
          <hr></hr>
        </div>
        <p style="font-size: 1.3rem;">
          <a href="#" onclick="drawSection('registration')">Создать новый аккаунт</a>
        </p>
      </div>
    </div>

    <div id="registration" class="section" style="display: none;">
      <div class="container">
        <!-- Блок регистрации -->
        <div id="registration_cont" class="row">
          <p class="hero-heading">Для завершения регистрации укажите свои контактные данные</p>
          <!-- Тип карты -->
          <!-- <div class="card_block">
            <label style="text-align: left;" for="reg_card_type_digital"><input type="radio" name="card_type" id="reg_card_type_digital" value="digital" checked> Виртуальная карта</label>
            <label style="text-align: left;" for="reg_card_type_analog"><input type="radio" name="card_type" id="reg_card_type_analog" value="analog"> Пластиковая карта</label>
          </div> -->
            <!-- <div class="card_block">
               <label style="text-align: left;" for="reg_card_type_digital"><input type="radio" name="card_type" id="reg_card_type_digital" value="digital" checked> Виртуальная карта</label>
               <label style="text-align: left;" for="reg_card_type_analog"><input type="radio" name="card_type" id="reg_card_type_analog" value="analog"> Пластиковая карта</label>
            </div> -->
          <!-- Номер телефона -->
          <div class="popup"><span class="popup-text" id="reg_phone_popup">Введите номер телефона</span></div>
          <input class="u-full-width" type="text" placeholder="+7-___-___-__-__" id="reg_phone" />
          <!-- Номер бонусной карты -->
          <!-- <div id="reg_card_number_group">
          <div class="popup"><span class="popup-text" id="reg_cardNumber_popup">Отсканируйте номер бонусной карты</span></div>
            <input class="u-full-width" type="text" placeholder="Номер бонусной карты" id="reg_cardNumber" />
          </div> -->
          <!-- Пароль -->
          <div class="popup"><span class="popup-text" id="reg_pass_popup">Введите пароль, не менее 6 символов</span></div>
          <div id="reg_password_group" style="display: grid; grid-template-columns: 1fr 1fr 1fr;">
            <input class="u-full-width" style="grid-area: 1/1/1/4;" type="password" placeholder="Пароль" id="reg_pass" />
            <i id="reg_pass_toggle" class="material-icons" style="grid-area: 1/3/1/4; align-self: center; justify-self: right; width: 40px; height: 40px;">remove_red_eye</i>
          </div>
          <!-- Прочие свойства -->
          <!--     <input class="u-full-width" type="email" placeholder="Email" id="reg_email" />-->
            <input class="u-full-width" type="text" placeholder="Имя" id="reg_firstname" />
          <!--     <input class="u-full-width" type="text" placeholder="Отчество" id="reg_middlename" />-->
          <!--     <input class="u-full-width" type="text" placeholder="Фамилия" id="reg_lastname" />-->
          <!-- Дата рождения -->
          <label for="reg_birthdate">Введите дату рождения</label>
          <div class="popup"><span class="popup-text" id="reg_birthdate_popup">Введите дату рождения</span></div>
          <input class="u-full-width" data-date-format="dd-mm-yyyy" type="text" placeholder="__-__-____" id="reg_birthdate" />
          <!-- <p>Какая карта Ваша?</p>
          <div class="card_block">
              <label style="text-align: left;" for="reg_card_type_prem"><input type="radio" name="card_discount" id="reg_card_type_prem" value="prem" checked> Премиум (скидки до 45%, кэшбек бонусными рублями)</label>
              <label style="text-align: left;" for="reg_card_type_discount"><input type="radio" name="card_discount" id="reg_card_type_discount" value="discount"> Дисконтная карта (скидки до 10%)</label>
          </div> -->
          <!-- <label for="reg_sex">Пол</label>
          <select class="u-full-width" id="reg_sex">
            <option value="0">Не выбран</option>
            <option value="1">Мужской</option>
            <option value="2">Женский</option>
          </select> -->
          <!--            <p>Какая карта Ваша?</p>-->
          <!--            <div class="card_block">-->
          <!--                <label style="text-align: left;" for="reg_card_type_prem"><input type="radio" name="card_discount" id="reg_card_type_prem" value="0" checked> Премиум (скидки до 45%, кэшбек бонусными рублями)</label>-->
          <!--                <label style="text-align: left;" for="reg_card_type_discount"><input type="radio" name="card_discount" id="reg_card_type_discount" value="1"> Дисконтная карта (скидки до 10%)</label>-->
          <!--            </div>-->
            <!-- Выбор города -->
            <p>Выберите город</p>
            <select id="reg_card_discount" class="reg_city">
                <option value="0">Биробиджан</option>
                <option value="1">Иное</option>
            </select>
          <!--          <label for="reg_sex">Пол</label>-->
          <!--          <select class="u-full-width" id="reg_sex">-->
          <!--            <option value="0">Не выбран</option>-->
          <!--            <option value="1">Мужской</option>-->
          <!--            <option value="2">Женский</option>-->
          <!--          </select>-->
          <!-- Согласие с условиями -->
          <p>Создавая аккаунт, я соглашаюсь с <a onclick="rules.style.display=''">правилами</a> и даю согласие на <a onclick="terms.style.display=''">обработку персональных данных</a>.</p>
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
        <p style="font-size: 1.3rem;">
          <span>Постойте, но ведь</span>
          <a href="#" onclick="drawSection('authorization')">я уже зарегистрирован</a>
        </p>
      </div>
    </div>

    <div id="personal" class="section personal" style="display: none;">
      <div class="container">
        <div
          style="text-align: left;">
          <p
            style="border-bottom: 1px solid #9e9e9e;">
            <i class="material-icons" style="vertical-align: middle">account_box</i>
            <span id="personal_name" class="neutral" style="color: #616161;">Наш Любимый Покупатель</span>
          </p>
          <p
            style="border-bottom: 1px solid #9e9e9e;">
            <i class="material-icons" style="vertical-align: middle">card_giftcard</i>
            <span id="personal_birthdate" class="neutral" style="color: #616161;"></span>
          </p>
          <p
            style="border-bottom: 1px solid #9e9e9e;">
            <i class="material-icons" style="vertical-align: middle">wc</i>
            <span id="personal_sex" class="neutral" style="color: #616161;"></span>
          </p>
          <p
            style="border-bottom: 1px solid #9e9e9e;">
            <i class="material-icons" style="vertical-align: middle">location_on</i>
            <span id="personal_city" class="neutral" style="color: #616161;"></span>
          </p>
          <p
            style="border-bottom: 1px solid #9e9e9e;">
            <i class="material-icons" style="vertical-align: middle">email</i>
            <span id="personal_email" class="neutral" style="color: #616161;"></span>
          </p>
          <p
            style="border-bottom: 1px solid #9e9e9e;">
            <i class="material-icons" style="vertical-align: middle">smartphone</i>
            <span id="personal_phone" class="neutral" style="color: #616161;">+7-___-___-__-__</span>
          </p>
        </div>

          <div id="replace_card">
              <p class="hero-heading">Переход на пластиковую карту:</p>
              <div class="popup"><span class="popup-text" id="personal_new_card_popup">Введите номер карты</span></div>
              <input class="u-full-width" type="text" placeholder="Номер карты" id="personal_new_card" popup_id="personal_new_card_popup"/>
              <button id="personal_changeCard_button" class="button-primary">Подтвердить</button>
          </div>

        <p class="hero-heading">Смена пароля:</p>
        <div class="popup"><span class="popup-text" id="personal_new_pass_popup">Введите новый пароль</span></div>
        <input class="u-full-width" type="password" placeholder="Новый пароль" id="personal_new_pass" popup_id="personal_new_pass_popup"/>
        <div class="popup"><span class="popup-text" id="personal_new_pass_confirmation_popup">Введенные пароли не совпадают</span></div>
        <input class="u-full-width" type="password" placeholder="Подтверждение нового пароля" id="personal_new_pass_confirmation" popup_id="personal_new_pass_confirmation_popup"/>
        <p>
          <button id="personal_changePassword_button" class="button-primary">Изменить пароль</button>
          <button onclick="logOff()">Выход</button>
        </p>
        <p style="font-size: 1.3rem;">
          <a href="/pravila">Правила</a> предоставления сервиса
        </p>
        <p style="font-size: 1.3rem;">
          <a href="/politika-konfidentsialnosti">Политика</a> в отношении обработки персональных данных
        </p>
      </div>
    </div>

    <div id="news" class="section news" style="display: none;">
      <div class="container">
        <div class="news">
          <img class="news-picture u-max-full-width" loading="lazy" src="app/assets/news/akcia-2021-06-10.jpeg" />
          <div class="news-date">11 июня 2021</div>
          <div class="news-title">ПРИГЛАШАЙТЕ ДРУЗЕЙ И ПОЛУЧАЙТЕ БОНУСЫ!</div>
          <div class="news-description">
            <p>Мы запустили реферальную программу, чтобы вы могли получать больше бонусов. Делитесь с друзьями вашей персональной ссылкой, и мы подарим 1000 бонусов вам за его первую покупку, а вашему другу 2000 за регистрацию.</p> 
            <p>КАК ПОЛУЧИТЬ БОНУСЫ?</p>
            <ul>
              <li><strong>Шаг 1</strong>: Вы зарегистрированы в бонусной программе «Столица» и у вас есть персональная ссылка. Скопируйте ее и поделитесь с друзьями, которые еще не стали участниками бонусной программы «Столица», любым удобным способом.</li>
              <li><strong>Шаг 2</strong>: Ваш друг регистрируется по ссылке и совершает свою первую покупку в магазине Столица*.</li>
              <li><strong>Шаг 3</strong>: Вы получаете 1000 бонусов за первую покупку друга, а ваш друг 2000 за регистрацию.</li>
            </ul>
            <p>Больше друзей – больше выгода!</p>
            <div><small>* Акция действует только для магазинов «Столица», расположенных в Еврейской Автономной области.</small></div>
          </div>
        </div>
        <div class="news">
          <img class="news-picture u-max-full-width" loading="lazy" src="app/assets/news/pexels-sabel-blanco-1835743.jpg" />
          <div class="news-date">27 апреля 2021</div>
          <div class="news-title">Старт системы лояльности</div>
          <div class="news-description">
            <div>Бонусы от "Столицы" - это выгодно!</div>
            <p>Пользуйся бонусной программой, выгода до 45%! 
              В программе участвуют магазины г. Биробиджана</p> 
            <p>Копи и трать бонусы:</p>
            <div>С <span style="font-weight: bold;">27.04.2021</span> г. - г. Биробиджан, Дзержинского 8</div>
            <div>С <span style="font-weight: bold;">28.04.2021</span> г. - г. Биробиджан ул. Пионерская 86д и ул. Шолом Алейхема 88</div>
          </div>
        </div>
      </div>
    </div>

    <div id="wallet" class="section wallet" style="display: none;">
      <div class="container">
        <div id="qrcode" style="display: none;"></div>
        <div>Ваш персональный код:</div>
        <div>
          <span id="cardNumber" class="neutral">Загрузка..</span>
        </div>
        <button id="downloadCard" style="display: none">Скачать QR код</button>
        <h5>
          <i class="material-icons neutral" style="vertical-align: middle">account_balance_wallet</i>
          БАЛАНС:
          <span id="bonuses" style="font-weight: bold; color: red;" class="load">Загрузка..</span>
        </h5>
        <details>
          <summary class="details">Открыть детализацию</summary>
          <div id="transactions">
            Загрузка..
          </div>
        </details>
      </div>
    </div>

    <div id="stores" class="section stores" style="display: none;">
      <div class="container">
        <div>Здесь вы можете потратить накопленные баллы:</div>
        <span id="storesPlaceholder" class="load">Загрузка..</span>
        <div id="storesList">
          <!-- <span class="ymaps-geolink" data-description="Алкомаркет 'Столица'">Биробиджан, улица Пионерская 86Д, магазин "Столица"</span> -->
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
        <p><small>*Бонусы начисляются после первой совершенной покупки другом. Акция действует только в г. Биробиджан.</small></p>
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

  </div>

  <div id=open-feedback-cont>
    <i id=open-feedback class="material-icons" onclick="feedback.style.display=''" style="display: none;">live_help</i>
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
  <!-- <script type="text/javascript" >
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    ym(75982831, "init", {
          clickmap:true,
          trackLinks:true,
          accurateTrackBounce:true
    });
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/75982831" style="position:absolute; left:-9999px;" alt="" /></div></noscript> -->
  <!-- /Yandex.Metrika counter -->
</body>
</html>