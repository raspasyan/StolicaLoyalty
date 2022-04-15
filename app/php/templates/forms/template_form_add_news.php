<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
  <meta name="theme-color" content="#33C3F0"/>

  <link rel="manifest" href="manifest.json" />

  <link rel="icon" type="image/png" sizes="192x192"
    href="app/assets/icons/192x192.png" />
  <link rel="apple-touch-icon" type="image/png" sizes="180x180"
    href="app/assets/icons/180x180.png" />

  <title>Столица: Лояльность</title>

  <link rel="stylesheet" href="app/build/styles/google-open-sans.css" />
  <link rel="stylesheet" href="app/build/styles/normalize.css" />
  <link rel="stylesheet" href="app/build/styles/skeleton_new.css" />
  <link rel="stylesheet" href="app/build/styles/style_desktop.css" />
</head>

<body>
    <style>
        input {
            display: block;
            width:100%;
        }
    </style>
    <div style="max-width:600px;margin:10rem auto;padding: 3rem;box-shadow: rgb(0 0 0 / 21%) 0px 2px 28px;">
        <form action="" method="POST"  enctype="multipart/form-data">
            <label>Номер новости:
                <input type="text" name="id" value=""/>
            </label><label>Название:
                <input type="text" name="title" value=""/>
            </label><label>Текст:
                <input type="text" name="desc" value=""/>
            </label><label>Маленький текст(со звездочкой):
                <input type="text" name="small" value=""/>
            </label><label>Дата:
                <input type="date" name="date" value=""/>
            </label><label>Картинка:
                <input type="file" name="img" value=""/>
            </label><label>Ключ:
                <input type="text" name="key" value=""/>
            </label>
                <input type="submit" value="Отправить" style="margin-top:5rem;"/>
        </form>
    </div>
</body>
</html>