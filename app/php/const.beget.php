<?php
    // Salt
    define("SOMESHIT", "MyNewBandIsCalledSyskill");
    define("SITE_DOMAIN", "bonus.stolica-dv.ru");

    define("YANDEX_API_KEY", "7a895d82-a17c-4fbd-8849-04120c71e5ae");

    // Перегрузка клиента SoapClient
    define("NON_WSDL_MODE", true);

    // Таймаут на запрос данных из центрума
    define("WALLET_TIMEOUT_SECONDS", 30);

    // Таймаут отправки сообщений
    define("MESSAGE_TIMEOUT_SECONDS", 15);
    // Лимит сообщений в час
    define("MESSAGE_HOUR_LIMIT", 6);

    // MariaDB
    define("DB_HOST", "localhost");
    // Production
    define("DB_USER", "root");
    define("DB_PASS", "O3sVT*Ib");
    define("DB_NAME", "stolica_bonusapp");

    // LOYALTY OPERATOR: SRC, LMX
    define("DEFAULT_LOYAL_PROVIDER", "LMX");

    // Set Centrum WSDL'S
    define("SR_ERP_WSDL", "SET-ERPIntegration/SET/WSCardsCatalogImport?WSDL");
    define("SR_CARDS_WSDL", "SET-Cards/SET/Cards/ExternalSystemCardsProcessing?WSDL");
    define("SR_PROCESSING_WSDL", "SET-Cards-InternalCards/SET/Cards/InternalCards/ProcessingManager?WSDL");
    define("SR_EXPIRATION_DAYS", 90);

    // Set Centrum (Production)
    define("SR_HOST_IP", "92.53.74.139");
    define("SR_HOST_PORT", "48090");
    define("SR_BONUS_ACCOUNT", 9812098);
    define("SR_BONUS_CARD_TYPE_ID", 33805713);
    define("SR_BONUS_CARD_TYPE_NAME", "BonusAppV3");

    // Loymax (Production)
    define("LMX_HOST", "https://stolica.loymax.tech");
    define("LMX_CLIENT_ID", "OAstolica");
    define("LMX_SECRET", "0f3e9c76f7e94d67bc2904f0da6840a2");
    define("LMX_REDIRECT_URL", "https://www.google.com/");
    define("LMX_ARM_USER_NAME", "RegUser");
    define("LMX_ARM_USER_PASS", "h!3CFd28G7dsl");

    // API
    define("API_TOKEN", "gruesome");
    define("CRON_TOKEN", "sorokalo");
    define("DEFAULT_PROVIDER", "DIG_FC");
    define("DEFAULT_SMS_PROVIDER", "BEE");   // NT, BEE, DIG, DIG_FC
    define("API_DEBUG", false);

    // SMS Gateway
    define("SMS_API_URL", "https://a2p-sms-https.beeline.ru/proto/http/");
    define("SMS_API_USER", "1673501");
    define("SMS_API_PASS", "16735011");

    // New-Tel Call Password
    define("NT_API_ACCESS_KEY", "0ea14a9651b5fa786f898e1fe22e965a859a2d7bf15e92e6");
    define("NT_API_SIGNATURE_KEY", "05329bf13c47480899d8f5339b02c6a6f1d61f4d45ad835e");
    
    // Digital
    define("DIG_API_TOKEN", "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqdm1fYmFja2VuZCIsInN1YiI6IjMwOCIsImNsaWVudF9pZCI6MzA1NzEsInR5cGUiOiJhY2Nlc3MiLCJnZW4iOjEsImdlbmVyYXRlZF9ieSI6Mjk2LCJuYW1lIjoi0KHRgtC-0LvQuNGG0LAiLCJpYXQiOjE2MTkwNjkwNDQsImV4cCI6OTIyMzM3MjAzNjg1NDc3NX0.LCKCeVSFD009WmqD3QjRAQV7qut-Cx57b5KWW17SYlA");
    
    // FTP CC
    define("FTP_HOST", "212.19.21.230");
    define("FTP_PORT", 6521);
    define("FTP_LOGIN", "1cwa");
    define("FTP_PASS", "CMs8ECnT9ray");
?>