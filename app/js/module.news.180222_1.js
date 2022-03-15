function drawNews(newsList) {
    let container = document.querySelector(".news>div.container");

    newsList.forEach(news => {
        let imageSrc = DOMAIN + "/" + news.image;

        let dateObj = new Date((news.date).replace(new RegExp("-", 'g'), "/"));
        let date = [
            (String(dateObj.getDate()).length == 1 ? "0" : "") + String(dateObj.getDate()),
            (String(dateObj.getMonth() + 1).length == 1 ? "0" : "") + String(dateObj.getMonth() + 1),
            String(dateObj.getFullYear())
        ].join(".");

        let newsContEl = document.createElement("div");
        newsContEl.classList.add("news__container");
        newsContEl.addEventListener("click", e => {
            document.querySelector(".newsOverlay").style.display = "block";
            document.querySelector(".newsOverlay__image").src = imageSrc;
            document.querySelector(".newsOverlay__details_date").innerText = date;
            document.querySelector(".newsOverlay__details_title").innerText = news.title;
            document.querySelector(".newsOverlay__details_descpription").innerHTML = news.description;

            document.querySelector(".newsOverlay__image").scrollIntoView();

            // document.querySelector(".newsOverlay").classList.add("animate__animated", "animate__fadeIn");

            document.body.classList.add("hideOverflow");

            document.querySelector(".newsOverlay").addEventListener("click", e => {
                if (e.target === e.currentTarget || e.target.type === "submit") {
                    e.currentTarget.style.display = "none";
                    document.body.classList.remove("hideOverflow");
                }
            });
        });

        let newsImageElement = document.createElement("img");
        newsImageElement.src = imageSrc;
        newsContEl.appendChild(newsImageElement);

        let newsDetailsElement = document.createElement("div");
        newsDetailsElement.classList.add("news__container_details");
        newsContEl.appendChild(newsDetailsElement);

        let newsDetailsDateElement = document.createElement("p");
        newsDetailsDateElement.classList.add("news__container_details_date");
        newsDetailsDateElement.innerText = date;
        newsDetailsElement.appendChild(newsDetailsDateElement);

        let newsDetailsTitleElement = document.createElement("h4");
        newsDetailsTitleElement.innerText = news.title;
        newsDetailsElement.appendChild(newsDetailsTitleElement);

        let newsButton = document.createElement("button");
        newsButton.classList.add("button-primary");
        newsButton.innerText = "Подробнее";
        newsDetailsElement.appendChild(newsButton);

        container.prepend(newsContEl);
    });
}