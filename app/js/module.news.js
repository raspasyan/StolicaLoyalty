function drawNews(newsList) {
    let container = document.getElementById("news").getElementsByClassName("container")[0];

    newsList.forEach(news => {
        let dateObj = new Date((news.date).replace(new RegExp("-", 'g'), "/"));
        let date = [
            (String(dateObj.getDate()).length == 1 ? "0" : "") + String(dateObj.getDate()),
            (String(dateObj.getMonth() + 1).length == 1 ? "0" : "") + String(dateObj.getMonth() + 1),
            String(dateObj.getFullYear())
        ].join(".");

        let newsContElement = document.createElement("div");
        newsContElement.classList.add("news-cont", "animate__animated", "animate__fadeInLeft");
        newsContElement.addEventListener("click", e => {
            document.getElementById("overlay-news").style.display = "block";
            document.getElementById("overlay-news-image").src = news.image;
            document.getElementById("overlay-news-details-date").innerText = date;
            document.getElementById("overlay-news-details-title").innerText = news.title;
            document.getElementById("overlay-news-details-descpription").innerHTML = news.description;

            document.getElementById("overlay-news-image").scrollIntoView();

            document.getElementById("overlay-news").classList.add("animate__animated", "animate__fadeIn");

            document.body.classList.add("overlay-show");

            document.getElementById("overlay-news").addEventListener("click", e => {
                if (e.target == e.currentTarget || e.target.type == "submit") {
                    e.currentTarget.style.display = "none";
                    document.body.classList.remove("overlay-show");
                }
            })
        });

        let newsImageElement = document.createElement("img");
        newsImageElement.classList.add("news-image");
        newsImageElement.src = news.image;
        newsContElement.appendChild(newsImageElement);

        let newsDetailsElement = document.createElement("div");
        newsDetailsElement.classList.add("news-details");
        newsContElement.appendChild(newsDetailsElement);

        let newsDetailsDateElement = document.createElement("p");
        newsDetailsDateElement.classList.add("news-details-date");
        newsDetailsDateElement.innerText = date;
        newsDetailsElement.appendChild(newsDetailsDateElement);

        let newsDetailsTitleElement = document.createElement("h4");
        newsDetailsTitleElement.classList.add("news-details-title");
        newsDetailsTitleElement.innerText = news.title;
        newsDetailsElement.appendChild(newsDetailsTitleElement);

        let newsButton = document.createElement("button");
        newsButton.classList.add("button-primary");
        newsButton.innerText = "Подробнее";
        newsDetailsElement.appendChild(newsButton);

        container.prepend(newsContElement);
    });
}