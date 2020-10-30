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
    if (document.getElementById("navbar").style.width == targetSize) {
        document.getElementById("navbar").style.width = "0";
        document.getElementById("navbar").style.borderRight = "0px";
        document.getElementById("openbutton").style.marginLeft = "0";
        document.getElementById("breadcrumbs").style.marginLeft = "0";

    } else {
        document.getElementById("navbar").style.width = targetSize;
        document.getElementById("navbar").style.borderRight = "1px solid #808080";
        document.getElementById("openbutton").style.marginLeft = targetSize;
        document.getElementById("breadcrumbs").style.marginLeft = targetSize;
    }
}
