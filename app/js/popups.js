function initPopups() {
    let popups = document.getElementsByClassName("popup-text");
    for (let index = 0; index < popups.length; index++) {
        const element = popups[index];
        element.addEventListener("click", function(e) {
            if (element.classList.contains("show")) element.classList.remove("show");
        });
    }
}
