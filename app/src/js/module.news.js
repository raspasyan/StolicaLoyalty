/* global C, d, DOMAIN */

function drawNews(newsList) {
    
    if (!newsList) {
        return false;
    }
    
    let container = C(".news>div.container").el;
    removeLoadOption("#news>div.container");
    newsList.forEach(news => {
        let imageSrc = DOMAIN + "/" + news.image,
            date = news.date.split("-").reverse().join(".");
            
        const temp = '<div class="news__container">\n\
                        <img src="' + imageSrc + '">\n\
                        <div class="news__container_details">\n\
                            <p class="news__container_details_date">' + date + '</p>\n\
                            <h4>' + news.title + '</h4>\n\
                            <button class="button-primary">Подробнее</button>\n\
                        </div>\n\
                      </div>';
        let newsContEl = C().strToNode(temp);

        container.prepend(newsContEl.el);
        
        newsContEl.el.addEventListener("click", () => {
            const el = C(".newsOverlay");

            show(".newsOverlay");
            
            C("img", el).el.src = imageSrc;
            C("h4", el).text(news.title);
            C("p", el).text(date);
            C("p", el).els[1].innerHTML = news.description;

            d.body.classList.add("hideOverflow");
        });
    });
}

C(".newsOverlay").el.addEventListener("click", e => {
    if (e.target === e.currentTarget || e.target.type === "submit") {
        hide(".newsOverlay");
        d.body.classList.remove("hideOverflow");
    }
});
