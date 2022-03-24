/* global C, d, DOMAIN */

function drawNews(newsList) {
    let container = C(".news>div.container").el;

    newsList.forEach(news => {
        let imageSrc = DOMAIN + "/" + news.image,
            dateObj = new Date((news.date).replace(new RegExp("-", 'g'), "/")),
            date = [
                    (String(dateObj.getDate()).length === 1 ? "0" : "") + String(dateObj.getDate()),
                    (String(dateObj.getMonth() + 1).length === 1 ? "0" : "") + String(dateObj.getMonth() + 1),
                    String(dateObj.getFullYear())
                ].join("."),
            newsContEl = C().create("div");
        
        newsContEl.addclass("news__container");
        newsContEl.el.addEventListener("click", e => {
            //C(".newsOverlay").el.style.display = "block";
            show(".newsOverlay");
            C(".newsOverlay__image").el.src = imageSrc;
            C(".newsOverlay__details_date").text(date);
            C(".newsOverlay__details_title").text(news.title);
            C(".newsOverlay__details_descpription").html(news.description);

            C(".newsOverlay__image").el.scrollIntoView();

            // C(".newsOverlay").addclass(["animate__animated", "animate__fadeIn"]);

            d.body.classList.add("hideOverflow");

            C(".newsOverlay").el.addEventListener("click", e => {
                if (e.target === e.currentTarget || e.target.type === "submit") {
                    hide(".newsOverlay");
                    d.body.classList.remove("hideOverflow");
                }
            });
        });

        let newsImageElement = C().create("img");
        newsImageElement.el.src = imageSrc;
        newsContEl.append(newsImageElement);

        let newsDetailsElement = C().create("div");
        newsDetailsElement.addclass("news__container_details");
        newsContEl.append(newsDetailsElement);

        let newsDetailsDateElement = C().create("p");
        newsDetailsDateElement.addclass("news__container_details_date");
        newsDetailsDateElement.text(date);
        newsDetailsElement.append(newsDetailsDateElement);

        let newsDetailsTitleElement = C().create("h4");
        newsDetailsTitleElement.text(news.title);
        newsDetailsElement.append(newsDetailsTitleElement);

        let newsButton = C().create("button");
        newsButton.addclass("button-primary");
        newsButton.text("Подробнее");
        newsDetailsElement.append(newsButton);

        container.prepend(newsContEl.el);
    });
}