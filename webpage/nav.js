// Navigation bar -- popover for "shopping cart", focus-capture modals for the other two

const cart = $("navCart");
const cartMessage = cart.appendHTML("div", { id: "popoverCart" });
cartMessage.appendHTML("div", { text: "🛒", style: "text-align: center; font-size:2em; padding: 1rem" });
cartMessage.appendHTML("div", { text: "Your shopping cart is empty. Is there a shortage or something?", style: "padding: 0; font-size: 0.9em;" });

const placeCart = () => {
  const pRect = cart.getBoundingClientRect();
  cartMessage.style.top = pRect.y + pRect.height + "px";
  cartMessage.style.width = pRect.width + "px";
};
const showCart = (e) => {
  cartMessage.style.transform = "scaleY(1)";
  cartMessage.classList.add("show");
};
const hideCart = (e) => {
  if ([...cartMessage.classList].includes("show") && ![cart, ...cart.children, ...cartMessage.children].includes(e.target)) {
    cartMessage.style.transform = "scaleY(0)";
    cartMessage.classList.remove("show");
  }
};

placeCart();
window.addEventListener("resize", placeCart);
cart.addEventListener("click", showCart);
window.addEventListener("click", hideCart);

const contact = $("navContact");
const about = $("navAbout");

const contactText = `<p>What's up? This page was made by Sam Ettinger, an out-of-work electronics/IoT/web designer. Beef this up</p>`;
const aboutText = `<p>lorem ipsum dolor sit amet, the plums that were in the icebox. add photo credits and links and stuff</p>`;
const smokescreen = $("fakenav").appendHTML("div", { class: "smokescreen" });
const contactMessage = contact.appendHTML("div", { class: "modalMessage", text: contactText });
const aboutMessage = about.appendHTML("div", { class: "modalMessage", text: aboutText });

const showModal = (target) => {
  if (target == "contact") {
    smokescreen.style.opacity = "80%";
    contactMessage.classList.add("show");
    contactMessage.style.opacity = "100%";
    contactMessage.style.top = "50%";
  } else {
    smokescreen.style.opacity = "80%";
    aboutMessage.classList.add("show");
    aboutMessage.style.opacity = "100%";
    aboutMessage.style.top = "50%";
  }
};
const hideModal = (e) => {
  if (![contact, about, contactMessage, aboutMessage, ...contactMessage.children, ...aboutMessage.children].includes(e.target)) {
    contactMessage.style.opacity = "0%";
    contactMessage.style.top = "40%";
    aboutMessage.style.opacity = "0%";
    aboutMessage.style.top = "40%";
    smokescreen.style.opacity = "0%";
  }
};
window.addEventListener("click", hideModal);
contact.addEventListener("click", (e) => showModal("contact"));
about.addEventListener("click", (e) => showModal("about"));
