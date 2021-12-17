<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <meta name="theme-color" content="#33C3F0"/>

  <link rel="manifest" href="manifest.json" />

  <link rel="icon" type="image/png" sizes="192x192"
    href="/app/assets/android-icon-192x192.png" />
  <link rel="apple-touch-icon" type="image/png" sizes="180x180"
    href="/app/assets/apple-icon-180x180.png" />

  <title>Столица: Лояльность</title>

  <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet" />

  <!-- import the webpage's stylesheet -->
  <link rel="stylesheet" href="/app/styles/normalize.css" />
  <link rel="stylesheet" href="/app/styles/skeleton.css" />
  <link rel="stylesheet" href="/app/styles/popups.css" />
  <link rel="stylesheet" href="/app/styles/datepicker.min.css" />
    <link rel="stylesheet" href="/app/styles/common.css" />
    <link rel="stylesheet" href="/app/styles/dashboard.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />


  <script src="/app/js/animate.js"></script>
  <script src="/app/js/popups.js"></script>
  <script src="/app/js/jquery.min.js"></script>
  <script src="/app/js/jquery.mask.min.js"></script>
  <script src="/app/js/qrious.min.js"></script>
  <script src="/app/js/datepicker.min.js"></script>
    <script src="/app/js/dashboard.js"></script>
</head>

<body>




      <?php switch ($auth):
          case 'login': ?>
              <header id="top-nav">
                  <div class="container">
                      <div class="dashboardLogout">
                          Вход выполнен!
                          <span id="logout" onclick="logout()">Выход</span>
                      </div>
                  </div>
              </header>

              <div id="dashboardContent">
                  <div class="dashboardContainer">
                      <div class="dashboardMain">
                          <div class="dashboardMenu"><ul></ul></div>
                          <div class="dashboardMenuContent">
                              <div class="dashboardMenuContentTop">
                                  <span class="dashboardMenuContentTitle"></span>
                                  <div class="dashboardMenuContentExport"></div>
                                  <div class="dashboardMenuContentSearch"></div>
                              </div>
                              <div class="dashboardMenuContentBlockHead"></div>
                              <div class="dashboardMenuContentBlockData"></div>
                              <div class="dashboardReport hidden"></div>
                              <div class="dashboardMenuContentBlockDataPagination"></div>
                          </div>
                          <div class="dashboardAccount hidden"></div>
                      </div>
                  </div>
              </div>

              <?php break; ?>
          <?php case 'not-login': ?>

              <div id="dashboardAuth" class="section">
                  <div class="container">
                      <p class="hero-heading">Вход в админ-панель</p>
                      <!-- Phone для входа в панель -->
                      <div class="popup"><span class="popup-text loginAuth" id="auth_phone_popup">Номер телефона</span></div>
                      <input class="u-full-width" type="text" placeholder="+7-___-___-__-__" id="auth_phone" tabindex="1" />
                      <!-- Пароль -->
                      <div class="popup"><span class="popup-text" id="auth_pass_popup">Введите пароль</span></div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr;">
                          <input class="u-full-width" style="grid-area: 1/1/1/4;" type="password" placeholder="Пароль" id="auth_pass" tabindex="2" />
                          <i id="auth_pass_toggle" class="material-icons" style="grid-area: 1/3/1/4; align-self: center; justify-self: right; width: 40px; height: 40px;">remove_red_eye</i>
                      </div>
                      <button class="button button-primary" style="width: 100%;" onclick="auth()" id="auth_button">Войти</button>
                  </div>
              </div>

              <?php break; ?>
          <?php endswitch; ?>









</body>
</html>