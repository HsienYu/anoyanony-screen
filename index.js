function get_data() {
    fetch("./data/foobar.json")
        .then(response => {
            return response.json();
        })
        .then(jsondata => {
            console.log(jsondata);
            // create a new div element
            jsondata.forEach(element => {
                var container = document.getElementsByClassName("grid-container");
                var item = document.createElement("div");
                item.setAttribute('id', element.id);
                item.setAttribute('class', 'grid-item');
                var name = document.createElement("p");
                name.innerHTML = element.name;
                var phone = document.createElement("p");
                phone.innerHTML = element.phone;
                var email = document.createElement("p");
                email.innerHTML = element.email;
                if (element.used == true) {
                    name.style.color = "grey";
                    phone.style.color = "grey";
                    email.style.color = "grey";
                }
                item.appendChild(name);
                item.appendChild(phone);
                item.appendChild(email);
                container[0].appendChild(item);
                $('.grid-container').scrollTop($('.grid-container')[0].scrollHeight);
            });
        })
}

function update_data() {
    get_data();
}

update_data();

setTimeout("location.reload(true);", 3000);

