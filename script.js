// Dropdown button toggles for multiple dropdowns
var dropdown = document.getElementsByClassName("dropdown-button");
var i;
for (i = 0; i < dropdown.length; i++) {
    dropdown[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === "block") {
            dropdownContent.style.display = "none";
        } else {
            dropdownContent.style.display = "block";
        }
    });
}

function navigation() {
    var targetSize = "25%";
    if (window.innerWidth >= 786) {
        targetSize = "200px";
    }
    document.getElementById("hamburger").classList.toggle('active');
    if (document.getElementById("navbar").style.width == targetSize) {
        document.getElementById("navbar").style.width = "0";
        document.getElementById("hamburger").style.marginLeft = "0";
        document.getElementById("breadcrumbs").style.marginLeft = "0";

    } else {
        document.getElementById("navbar").style.width = targetSize;
        document.getElementById("hamburger").style.marginLeft = targetSize;
        document.getElementById("breadcrumbs").style.marginLeft = targetSize;
    }
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}