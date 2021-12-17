let dashboardMenu = {
    accounts: [
        {
            name: "Пользователи",
            icon: "group",
        }
    ],
    transactions: [
        {
            name: "Транзакции",
            icon: "receipt_long",
        }
    ],
    reports: [
        {
            name: "Отчеты",
            icon: "outlined_flag",
        }
    ],
    journal: [
        {
            name: "Журнал",
            icon: "book_online",
        }
    ],
    settings: [
        {
            name: "Настройки",
            icon: "settings",
        }
    ],
    // // bonuscards: "Бонусные карты",
    // transactions: "Транзакции",
    // transactionsDetails: "Детализация транзакиции",
    // settings: "Настройки",
};


async function auth()
{
    let phone = $("#auth_phone").val().split('-').join('').split('+').join('');
    let password = $("#auth_pass").val();


    let body = {
        "method": "authDashboard",
        "data": {
            "phone": phone,
            "pass": password,
        }
    };

    let response = await fetch("/dashboard-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(body)
    });

    let result = await response.json();

    console.log(result);


    if(result.status){
        location.reload();
    }
    else{
        $("#dashboardAuth").show();
    };

};


async function logout()
{
    let body = {
        "method": "logoutDashboard",
    };

    let response = await fetch("/dashboard-logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(body)
    });

    location.reload();
}


function renderMenu(dashboardMenu)
{
    $.each(dashboardMenu, function(index, value) {
        $(".dashboardMenu ul").append("<li class='dashboardMenuItem' data-menu='" + index+ "'><span class='material-icons'>"+ value[0].icon +"</span><span class='menuName'>" + value[0].name + "</span></li>");
    });
    $(".dashboardMenuItem").first().addClass("menuActive");
}


async function getContent(menuItem, page, search = false)
{
    let sort = localStorage.getItem('sort');
    (sort == null) ? sort = 'id' : sort = sort;
    let sortDirection = localStorage.getItem('sortDirection');
    (sortDirection == null) ? sortDirection = 'asc' : sortDirection = sortDirection;

    let date = 'none';

    // (search) ? search = search : search = false;

    let body = {
        "method": "DashboardContent",
        "menuItem": menuItem,
        "page": page,
        "sort": sort,
        "sortDirection": sortDirection,
        "search": search,
        "date": date,
    };

    let response = await fetch("/dashboard-content", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(body)
    });


    let result = await response.json();

    console.log(result);


    $(".dashboardMenuContentBlockData").html('');
    $(".dashboardMenuContentBlockHead").html('');
    $(".dashboardMenuContentBlockData").removeClass("reports");
    $(".dashboardMenuContentDateSort").remove();
    $(".dashboardReport").html('');

    if (result.Export){
        $(".dashboardMenuContentExport").html('');
        $(".dashboardMenuContentExport").append("<a href='/dashboard-export?table=" + menuItem + "' target='_blank'>Экспорт</a>");
    }
    else{
        $(".dashboardMenuContentExport").html('');
    }


    if(result.SearchRow){
        $(".content-item").remove();
        $(".dashboardMenuContentSearch").html('');
        $(".dashboardMenuContentSearch").attr('');
        $(".dashboardMenuContentSearch").removeAttr('data-type');
        $(".dashboardMenuContentSearch").append("<select id='search'></select><input type='text' name='search'><button>Поиск</button>");

        $.each(result.SearchRow, function(index, value) {
            $("#search").append("<option value='" + value + "'>" + index + "</option>");
        });
        $(".dashboardMenuContentExport").css("right", "33%");
    }
    else{
        $(".dashboardMenuContentSearch").html('');
        $(".dashboardMenuContentExport").css("right", "0px");
    }


    let width = (100 - 4) / (Object.keys(result.Head).length - 1);

    (result.sortDirection == 'asc') ? sortDirection = 'desc' : sortDirection = 'asc';
    (result.sortDirection == 'asc') ? directionSumbol = '<i class="fa fa-long-arrow-up" aria-hidden="true"></i>' : directionSumbol = '<i class="fa fa-long-arrow-down" aria-hidden="true"></i>';
    (result.sortDirection == 'desc') ? sortDirection = 'asc' : sortDirection = 'desc';

    $.each(result.Head, function(index, value) {
        let dataSort = false;
        if (value.sort){
            dataSort = value.sortName;
        }


        if (index == 'ID'){
            $(".dashboardMenuContentBlockHead").append("<div class='content-item' data-sort='" + dataSort + "' style='width:4%' data-menu='" + menuItem + "' data-page='" + page + "' data-sort-direction='" + sortDirection + "'>" + index + "</div>");
        }
        else{
            $(".dashboardMenuContentBlockHead").append("<div class='content-item' data-sort='" + dataSort + "' style='width:" + width + "%' data-menu='" + menuItem + "' data-page='" + page + "' data-sort-direction='" + sortDirection + "'>" + index + "</div>");
        }
    });

    $(".dashboardMenuContentBlockHead .content-item").each(function(){
        if ($(this).attr("data-sort") == sort){
            $(this).append(directionSumbol);
        }
    });


    $.each(result.Data, function(index, value) {
        switch(menuItem){
            case 'accounts':
                let sex;
                (value.sex == 1) ? sex = 'муж' : sex = 'жен';
                $(".dashboardMenuContentBlockData").append("<div class='content-item account' data-id='" + value.id + "'><span style='width:4%'>" + value.id + "</span><span style='width:" + width + "%'>" + value.phone + "</span><span style='width:" + width + "%'>" + value.card_number + "</span><span style='width:" + width + "%'>" + value.balance + "</span><span style='width:" + width + "%'>" + sex + "</span><span style='width:" + width + "%'>" + value.firstname + "</span><span style='width:" + width + "%'>" + value.middlename + "</span><span style='width:" + width + "%'>" + value.lastname + "</span><span style='width:" + width + "%'>" + value.city + "</span><span style='width:" + width + "%'>" + value.birthdate + "</span></div>");
                break;
            case 'transactions':
                let amount = value.amount / 100;
                let type;
                switch(value.type) {
                    case 'CHARGE':
                        type = 'Начисление';
                        break;
                    case 'WRITE_OFF':
                        type = 'Списание';
                        break;
                    default:
                        type = value.type;
                }
                $(".dashboardMenuContentBlockData").append("<div class='content-item transact' data-id='" + value.id + "' data-card='" + value.bonuscard_id + "' data-ext='" + value.ext_id + "'><span style='width:4%'>" + value.id + "</span><span style='width:" + width + "%'>" + amount + "</span><span style='width:" + width + "%'>" + type + "</span><span style='width:" + width + "%'>" + value.rsa_id + "</span></div>");
                break;
            case 'reports':
                $(".dashboardMenuContentBlockData").append("<div class='report-item report'><span data-report=" + value + ">" + index + "</span></div>").addClass("reports");
                break;
            case 'journal':
                $(".dashboardMenuContentBlockData").append("<div class='content-item log'><span style='width:4%'>" + value.id + "</span><span style='width:" + width + "%'>" + value.source + "</span><span style='width:" + width + "%'>" + value.event + "</span><span style='width:" + width + "%'>" + value.status + "</span><span style='width:" + width + "%'>" + value.comment + "</span><span style='width:" + width + "%'>" + value.time + "</span></div>").addClass("logs");
                break;
        }
    });
    $(".dashboardMenuContentBlockDataPagination span").remove();
    if (result.Data.length > 59){
        paginationRender(page, result.Pages, menuItem, false);
    }
}


function dateSortChange(dateFrom, dateTo, page)
{
    if(typeof dateFrom == 'undefined' || typeof dateTo == 'undefined'){
        return false
    }
    else{
        let reportItem = $(".dashboardMenuContentDateSort").attr("data-report");
        let date = dateFrom + '||' + dateTo;
        getReport(reportItem, date, page);
    }
}


function paginationRender(page, pages, menuItem, reportItem)
{
    let pageNumber = parseInt(page);
    let pagesBack = pageNumber - 2;
    let pageNext = pageNumber + 3;
    let dataAttr = 'data-menu';
    let dataAttrVal = menuItem;

    if (reportItem){
        dataAttr = 'data-report';
        dataAttrVal = reportItem;
    }


    if (pageNumber > 5){
        for (let i = pagesBack; i < page; i++) {
            $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
        }
        for (let i = page; i < pageNext; i++) {
            $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
        }
    }

    else{
        switch (pageNumber){
            case 1:
                for (let i = pageNumber; i < pageNext + 2; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                break;
            case 2:
                for (let i = 1; i < 2; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                for (let i = pageNumber; i < pageNext + 1; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                break;
            case 3:
                for (let i = 1; i < 3; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                for (let i = pageNumber; i < pageNext; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                break;
            case 4:
                for (let i = 2; i < 4; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                for (let i = pageNumber; i < pageNext; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                break;
            case 5:
                for (let i = 3; i < 5; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                for (let i = pageNumber; i < pageNext; i++) {
                    $(".dashboardMenuContentBlockDataPagination").append("<span " + dataAttr + "='" + dataAttrVal + "' data-page='" + i + "'>"+ i +"</span>");
                }
                break;
        }
    }


    $(".dashboardMenuContentBlockDataPagination span").each(function(){
        if($(this).attr("data-page") == pageNumber){
            $(this).addClass("page-active");
        }
    })
}



async function getTransactionDetails(id, cardID, extID)
{
    let body = {
        "method": "DashboardTransactionDetails",
        "id": id,
        "cardID": cardID,
        "extID": extID,
    };



    let response = await fetch("/dashboard-transaction-details", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(body)
    });

    let result = await response.json();

    console.log(result);


    $(".transact").each(function(){
        if ($(this).attr("data-ext") == extID){
            switch (result[0].type) {
                case "WRITE_OFF":
                    $(this).append("<div class='transactDetails details-" + extID + "' onclick='event.stopPropagation()'><div class='transactDetailsItem'><span style='font-weight: 600'>-" + result[0].amount + " бонусов, </span><span class='bad'>Списание</span></div><div class='transactDetailsItem'><span class='neutral'>Дата:</span><span>" + result[0].operation_date + "</span></div><div class='transactDetailsItem'><span class='neutral'>Источник:</span><span>" + result[0].store_title + "</span></div><div class='transactDetailsItem'><table class='position'><tr><th>Наименование</th><th>Цена</th><th>Цена со скидкой</th><th>% скидки</th><th>Списанные бонусы</th></tr></table></div></div>");
                    if (result[0].purchase_data.positions){
                        $.each(result[0].purchase_data.positions, function(index, value) {
                            let percentDiscount = 100 / (parseInt(value.cost) / (parseInt(value.cost) - parseInt(value.amount)));
                            $(".details-" + extID + "").find(".position").append("<tr><td>" + value.product_title + "</td><td>" + value.cost + " ₽</td><td>" + value.amount + " ₽</td><td>" + Math.round(percentDiscount).toFixed(2) + " %</td><td class='bad'>-" + value.discount_amount + " ₽<td></tr>");
                        });
                        let amount = parseInt(result[0].purchase_data.amount) + parseInt(result[0].purchase_data.discount_amount);
                        $(this).find(".position").append("<tr><th>Итого</th><th>" + amount + " ₽</th><th>" + result[0].purchase_data.amount + " ₽</th><th></th><th class='bad'>-" + result[0].amount + " ₽<th></tr>");
                    }
                    break;
                case "CHARGE":
                    if (result[0].purchase_data == undefined){
                        $(this).append("<div class='transactDetails' onclick='event.stopPropagation()'><div class='transactDetailsItem'><span style='font-weight: 600'>+" + result[0].amount + " бонусов, </span><span class='good'>Начисление</span></div><div class='transactDetailsItem'><span class='neutral'>Дата:</span><span>" + result[0].operation_date + "</span></div><div class='transactDetailsItem'><span class='neutral'>Источник:</span><span>" + result[0].store_title + "</span></div></div>");
                    }
                    if (result[0].purchase_data !== undefined){
                        $(this).append("<div class='transactDetails'><div class='transactDetailsItem'><span style='font-weight: 600'>+" + result[0].amount + " бонусов, </span><span class='good'>Начисление</span></div><div class='transactDetailsItem'><span class='neutral'>Дата:</span><span>" + result[0].operation_date + "</span></div><div class='transactDetailsItem'><span class='neutral'>Источник:</span><span>" + result[0].store_title + "</span></div><div class='transactDetailsItem'><table class='position'><tr><th>Наименование</th><th>Оплачено</th><th>Начислено бонусов</th></tr></table></div></div>");
                        $.each(result[0].purchase_data.positions, function(index, value) {
                            $(".details-" + extID + "").find(".position").append("<tr><td>" + value.product_title + "</td><td>" + value.cost + " ₽</td><td class='good'>+" + value.cashback_amount + " ₽</td></tr>");
                        });
                        let amount = parseInt(result[0].purchase_data.amount) + parseInt(result[0].purchase_data.discount_amount);
                        $(this).find(".position").append("<tr><th>Итого</th><th>" + amount + " ₽</th><th class='good'>+" + result[0].amount + " ₽<th></tr>");
                    }
                    break;
            }
        }
    });
}


async function getAccount(id)
{
    let body = {
        "method": "getAccount",
        "id": id,
    };


    let response = await fetch("/get-account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(body)
    });

    let result = await response.json();

    $(".dashboardAccount").html('');
    $(".dashboardAccount").append("<div class='dashboardAccountTop'><span class='dashboardAccountTopTitle'>Пользователь <b>#" + result.account.id + "</b></span></div><div class='dashboardAccountContent'><div class='dashboardAccountContentItem'><span>Имя: </span><input type='text' name='firstname' value='" + result.account.firstname + "'></div><div class='dashboardAccountContentItem'><span>Отчество: </span><input type='text' name='middlename' value='" + result.account.middlename + "'></div><div class='dashboardAccountContentItem'><span>Фамилия: </span><input type='text' name='lastname' value='" + result.account.lastname + "'></div><div class='dashboardAccountContentItem'><span>Дата рождения: </span><input type='text' name='birthdate' value='" + result.account.birthdate + "'></div><div class='dashboardAccountContentItem'><input type='hidden' id='phone_account' name='phone' value='" + result.account.phone + "'></div></div><div class='dashboardAccountBtns'><button id='back'>Отмена</button><button id='updateAccount'>Сохранить</button></div><div class='dashboardAccountTransactions'><span class='dashboardAccountTransactionsTitle'>Транзакции</span><div class='dashboardAccountTransactionsData'></div>");

    $.each(result.transactions.data, function(index, value) {
        $(".dashboardAccountTransactionsData").append("<div class='accountTransactions transact' data-id='" + value.purchase_id + "' data-card='" + result.cardID + "' data-ext='" + value.ext_id + "'><span style='width: 25%'>" + value.operation_date + "</span><span style='width: 10%'>" + value.amount + "</span><span style='width: 25%'>" + value.type + "</span><span style='width: 40%'>" + value.store_title + "</span></div>");
    });


    console.log(result);
}



async function updateProfile(phone, firstname, lastname, middlename, birthdate)
{
    let body = {
        "method": "updateProfile",
        "phone": phone,
        "data": {
            "firstname": firstname,
            "middlename": middlename,
            "lastname": lastname,
            "birthdate": birthdate,
        }
    };

    let response = await fetch("/update-profile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(body)
    });

    let result = await response.json();
    console.log(result);

    if (result.status){
        $(".dashboardAccountBtns").append("<span class='dashboardUpdateSuccess'>Данные обновленны!</span>");
        setTimeout(function(){
            $(".dashboardUpdateSuccess").remove();
        }, 3000);
        console.log('update success');
    }
    else{
        console.log('error');
    }

}


async function exportTable(data) {
    let response = await fetch("/dashboard-export", {
        method: "POST",
        body: JSON.stringify({
            data: 'tableName'
        })
    });
}



async function getReport(data, date, page, search = false) {
    let body = {
        "method": "getReport",
        "reportItem": data,
        "date": date,
        "page": page,
        "search": search,
    };

    let response = await fetch("/dashboard-report", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(body)
    });

    const reader = response.body.getReader();
    const contentLength = response.headers.get("Access-Control-Expose-Headers");
    let receivedLength = 0; // количество байт, полученных на данный момент
    let chunks = []; // массив полученных двоичных фрагментов (составляющих тело ответа)
    while(true) {
        const {done, value} = await reader.read();

        if (done) {
            break;
        }

        chunks.push(value);
        receivedLength += value.length;

        let percent = 100 / (contentLength / receivedLength);

        $(".progress-load").remove();
        $("#top-nav").append("<div class='progress-load' style='border:1px solid #87ceeb;position: absolute;top: 48px;width:" + percent + "%;overflow: hidden;max-width: 100%'></div>");

        $(".block-content-btns").remove();
        $(".dashboardMenuContent").append("<div class='block-content-btns' style='height: 80px;position: absolute;top: 0px;z-index: 99999;width: 100%;left: 0px;'></div>");

        if (receivedLength >= contentLength){
            setTimeout(() => $(".progress-load").remove(), 1000);
            setTimeout(() => $(".block-content-btns").remove(), 1000);
        }

        setTimeout(() => $(".progress-load").remove(), 3000);
        setTimeout(() => $(".block-content-btns").remove(), 3000);

        console.log(contentLength + '=-=-=' + receivedLength);

        console.log(`Получено ${percent} из ${contentLength}`)
    }

    let chunksAll = new Uint8Array(receivedLength); // (4.1)
    let position = 0;
    for(let chunk of chunks) {
        chunksAll.set(chunk, position); // (4.2)
        position += chunk.length;
    }

    let content = new TextDecoder("utf-8").decode(chunksAll);
    let result = JSON.parse(content);

    console.log(result);


    $(".dashboardMenuContentBlockData").html('');
    $(".dashboardMenuContentBlockData").removeClass("reports");
    $(".dashboardMenuContentTitle").text("Отчет: " + result.title);
    $(".dashboardMenuContentDateSort").remove();
    $(".dashboardReport").html('');
    $(".dashboardMenuContentExport").html('');
    $(".dashboardMenuContentBlockHead").html('');
    $(".dashboardMenuContentBlockDataPagination").html('');


    if(result.SearchRow){
        $(".content-item").remove();
        $(".dashboardMenuContentSearch").html('');
        $(".dashboardMenuContentSearch").attr('');
        $(".dashboardMenuContentSearch").removeAttr('data-type');
        $(".dashboardMenuContentSearch").attr('data-type', 'report');
        $(".dashboardMenuContentSearch").append("<select id='search'></select><input type='text' name='search'><button>Поиск</button>");

        $.each(result.SearchRow, function(index, value) {
            $("#search").append("<option value='" + value + "'>" + index + "</option>");
        });
        $(".dashboardMenuContentExport").css("right", "0px");
    }
    else{
        $(".dashboardMenuContentSearch").html('');
        $(".dashboardMenuContentExport").css("right", "0px");
    }



    $(".dashboardMenuContentTop").append("<div class='dashboardMenuContentDateSort' data-report='" + data + "'>Дата: от <input type='text' id='dateFrom'> до <input type='text' id='dateTo'></div>");
    $("#dateFrom").val(result.dateFrom);
    $("#dateTo").val(result.dateTo);
    let searchLink = (search) ? search.alias + '||' + search.row.split(" ").join("|") : 'none';
    $(".dashboardMenuContentExport").append("<a href='/report-export?report=" + data + "&date=" + date + "&search=" + searchLink + "' target='_blank'>Экспорт</a>")
    $(function(){
        let dateFrom;
        let dateTo;
        $("#dateFrom").datepicker({
            dateFormat: 'yyyy-mm-dd',
            onSelect: function(dateText) {
                dateFrom = dateText;
                dateSortChange(dateFrom, dateTo, page);
            }
        });
        $("#dateTo").datepicker({
            dateFormat: 'yyyy-mm-dd',
            onSelect: function(dateText) {
                dateTo = dateText;
                dateSortChange(dateFrom, dateTo, page);
            }
        });
    });


    $(".dashboardReport").removeClass("hidden");

    $(".dashboardReport").append("<div class='dashboardReportHead'></div>");
    $.each(result.head, function(index, value) {
        if(value == "Из них учавствуют"){
            $(".dashboardMenuContentBlockHead").append("<div style='width: 80%'>" + value + "</div>");
            return false;
        }
        $(".dashboardMenuContentBlockHead").append("<div>" + value + "</div>");
    });

    $.each(result.data, function(index, value) {
        let report = JSON.parse(value.report);
        switch (result.title) {
            case "Детализация чеков":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 13%'>" + report["title"] + "</span><span style='width: 5%'>" + report["rsa_id"] + "</span><span style='width: 5%'>" + report["operation_type"] + "</span><span style='width: 5%'>" + report["shift"] + "</span><span style='width: 5%'>" + report["cash"] + "</span><span style='width: 6%'>" + report["sale_time"] + "</span><span style='width: 5%'>" + report["amount"] + "</span><span style='width: 5%'>" + report["cashback_amount"] + "</span><span style='width: 5%'>" + report["discount_amount"] + "</span><span style='width: 13%'>" + report["discount_card"] + "</span><span style='width: 5%'>" + report["product_id"] + "</span><span style='width: 5%'>" + report["count"] + "</span><span style='width: 5%'>" + report["cost"] + "</span><span style='width: 5%'>" + report["cashback"] + "</span><span style='width: 5%'>" + report["discount"] + "</span><span style='width: 5%'>" + report["amount_pay"] + "</span><span style='width: 13%'>" + report["position"] + "</span></div>");
                break;
            case "Карты без движений":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 12%'>" + report["card_number"] + "</span><span style='width: 12%'>" + report["phone"] + "</span><span style='width: 4%'>" + report["type"] + "</span><span style='width: 12%'>" + report["city"] + "</span><span style='width: 12%'>" + report["last_sync"] + "</span><span style='width: 12%'>" + report["firstname"] + "</span><span style='width: 12%'>" + report["middlename"] + "</span><span style='width: 12%'>" + report["lastname"] + "</span><span style='width: 12%'>" + report["email"] + "</span></div>");
                break;
            case "Приведи друга":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 10%'>" + report["card_number"] + "</span><span style='width: 10%'>" + report["ref_card_number"] + "</span><span style='width: 10%'>" + report["last_sync"] + "</span><span style='width: 10%'>" + report["amount"] + "</span><span style='width: 10%'>" + report["discount_amount"] + "</span><span style='width: 10%'>" + report["cashback_amount"] + "</span></div>");
                break;
            case "Бонусы на ДР":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 8%'>" + report["phone"] + "</span><span style='width: 8%'>" + report["firstname"] + "</span><span style='width: 8%'>" + report["middlename"] + "</span><span style='width: 8%'>" + report["lastname"] + "</span><span style='width: 7%'>" + report["birthdate"] + "</span><span style='width: 2%'>" + report["sex"] + "</span><span style='width: 10%'>" + report["card_number"] + "</span><span style='width: 10%'>" + report["start_dr"] + "</span><span style='width: 10%'>" + report["end_dr"] + "</span><span style='width: 2%'>" + report["amount_purchases_dr"] + "</span><span style='width: 5%'>" + report["purchases_dr"] + "</span><span style='width: 5%'>" + report["cashback_dr"] + "</span><span style='width: 5%'>" + report["sale_dr"] + "</span> <span style='width: 10%'>" + report["start_before_dr"] + "</span><span style='width: 10%'>" + report["end_before_dr"] + "</span><span style='width: 2%'>" + report["amount_purchase_before_dr"] + "</span><span style='width: 5%'>" + report["purchases_before_dr"] + "</span><span style='width: 5%'>" + report["cashback_before_dr"] + "</span><span style='width: 5%'>" + report["sale_before_dr"] + "</span></div>");
                break;
            case "Продажи, детализация полная":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 10%'>" + report["discount_card"] + "</span><span style='width: 10%'>" + report["balance"] + "</span><span style='width: 10%'>" + report["total_discount"] + "</span><span style='width: 10%'>" + report["total_cashback"] + "</span><span style='width: 10%'>" + report["total_purchases"] + "</span><span style='width: 10%'>" + report["number"] + "</span><span style='width: 10%'>" + report["operation_type"] + "</span><span style='width: 10%'>" + report["amount"] + "</span><span style='width: 10%'>" + report["discount_amount"] + "</span><span style='width: 10%'>" + report["cashback_amount"] + "</span><span style='width: 10%'>" + report["sale_time"] + "</span></div>");
                break;
            case "Продажи, детализация":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 8.3%'>" + report["discount_card"] + "</span><span style='width: 12%'>" + report["last_sync"] + "</span><span style='width: 6%'>" + report["balance"] + "</span><span style='width: 8.3%'>" + report["total_cashback"] + "</span><span style='width: 8.3%'>" + report["total_discount"] + "</span><span style='width: 8.3%'>" + report["total_purchases"] + "</span><span style='width: 8.3%'>" + report["number"] + "</span><span style='width: 8.3%'>" + report["operation_type"] + "</span><span style='width: 8.3%'>" + report["sale_time"] + "</span><span style='width: 8.3%'>" + report["amount"] + "</span><span style='width: 8.3%'>" + report["discount_amount"] + "</span><span style='width: 8.3%'>" + report["cashback_amount"] + "</span></div>");
                break;
            case "Продажи, общее":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 10%'>" + report["discount_card"] + "</span><span style='width: 10%'>" + value["Списания всего"] + "</span><span style='width: 10%'>" + value["Начисления всего"] + "</span><span style='width: 10%'>" + value["Чеков всего"] + "</span><span style='width: 10%'>" + value["Сумма чека"] + "</span></div>");
                break;
            case "Новые по розыгрышу":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 20%'>" + report["count"] + "</span><span style='width: 80%'>" + report["reg"] + "</span></div>");
                break;
            case "Баланс карт":
                $(".dashboardReport").append("<div class='report-item-page'><span style='width: 13%'>" + report["phone"] + "</span><span style='width: 13%'>" + report["firstname"] + "</span><span style='width: 13%'>" + report["middlename"] + "</span><span style='width: 13%'>" + report["lastname"] + "</span><span style='width: 13%'>" + report["card_number"] + "</span><span style='width: 13%'>" + report["balance"] + "</span><span style='width: 13%'>" + report["sale_time"] + "</span><span style='width: 13%'>" + report["last_sync"] + "</span></div>");
                break;
        }

    });

    if (result.data.length > 99){
        paginationRender(page, result.pages, false, data);
    }


}



$('#auth_phone').mask('+7-000-000-00-00');


$(document).ready(function(){
    renderMenu(dashboardMenu);
    getContent('accounts', 1);
});



$(document).on("click", ".dashboardMenuItem", function(){
    let menuItem = $(this).attr("data-menu");
    let menuText = $(this).find(".menuName").text();
    $(".dashboardMenuItem").removeClass("menuActive");
    $(this).addClass("menuActive");
    $(".dashboardMenuContentTitle").text(menuText);
    localStorage.removeItem('sort');
    localStorage.removeItem('sortDirection');
    getContent(menuItem, 1);
    $(".dashboardMenuContent").removeClass('hidden');
    $(".dashboardAccount").addClass('hidden');
});



$(document).on("click", ".dashboardMenuContentBlockDataPagination span", function(){
    let menuItem = $(this).attr("data-menu");
    let page = $(this).attr("data-page");
    if(menuItem == undefined){
        menuItem = $(this).attr("data-report");
        let date = $("#dateFrom").val() + '||' + $("#dateTo").val();
        getReport(menuItem, date, page);
    }
    else{
        getContent(menuItem, page);
    }
});



$(document).on("click", ".transact", function(){
    let transactID = $(this).attr("data-id");
    let cardID = $(this).attr("data-card");
    let extID = $(this).attr("data-ext");
    if(!$(this).hasClass("transactClose")){
        getTransactionDetails(transactID, cardID, extID);
    }
    else{
        $(this).find(".transactDetails").remove();
    }
    $(this).toggleClass("transactClose");
});




$(document).on("click", ".dashboardMenuContentBlockHead .content-item", function(){
    if($(this).attr("data-sort") !== 'none'){
        let sort = $(this).attr("data-sort");
        let sortDirection = $(this).attr("data-sort-direction");
        localStorage.setItem('sort', sort);
        localStorage.setItem('sortDirection', sortDirection);

        let menuItem = $(this).attr("data-menu");
        let page = $(this).attr("data-page");
        getContent(menuItem, page);
    }
});




$(document).on("click", ".dashboardMenuContentSearch button", function(){
    let searchAlias = $("#search").val();
    let searchRow = $(".dashboardMenuContentSearch input").val();

    let searchData = {
        'alias': searchAlias,
        'row': searchRow,
    };

    // let page = $(".dashboardMenuContentBlockHead .content-item:first").attr('data-page');
    if($(".dashboardMenuContentSearch").attr('data-type') == 'report'){
        let reportItem = $('.dashboardMenuContentDateSort').attr('data-report');
        let page = 1;
        let date = $("#dateFrom").val() + '||' + $("#dateTo").val();
        getReport(reportItem, date, page, searchData);
    }
    else{
        let menuItem = $(".dashboardMenuContentBlockHead .content-item:first").attr('data-menu');
        getContent(menuItem, 1, searchData);
    }

    let menuItem = $(".dashboardMenuContentBlockHead .content-item:first").attr('data-menu');
    // let page = $(".dashboardMenuContentBlockHead .content-item:first").attr('data-page');

    // getContent(menuItem, 1, searchData);
});




$(document).on("click", ".account", function(){
    let accountID = $(this).attr('data-id');
    $(".dashboardMenuContent").addClass('hidden');
    $(".dashboardAccount").removeClass('hidden');
    getAccount(accountID);
});

$(document).on("click", "#back", function(){
    $(".dashboardAccount").addClass('hidden');
    $(".dashboardMenuContent").removeClass('hidden');
});



$(document).on("click", "#updateAccount", function(){
    let phone = $("#phone_account").val();
    let firstname = $(".dashboardAccountContentItem input[name='firstname']").val();
    let lastname = $(".dashboardAccountContentItem input[name='lastname']").val();
    let middlename = $(".dashboardAccountContentItem input[name='middlename']").val();
    let birthdate = $(".dashboardAccountContentItem input[name='birthdate']").val();

    updateProfile(phone, firstname, lastname, middlename, birthdate);
});




$(document).on("click", "#dashboardExport", function(){
    let exportItem = $(this).attr('data-export');
    exportTable(exportItem);
});


$(document).on("click", ".report", function(){
    let reportItem = $(this).find('span').attr('data-report');
    let date = 'none';
    let page = 1;
    getReport(reportItem, date, page);
});


