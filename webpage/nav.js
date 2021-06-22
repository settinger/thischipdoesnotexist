// Navigation bar -- popover for "shopping cart", focus-capture modals for the other two

const cart = $("navCart");
const cartMessage = cart.appendHTML("div", { id: "popover-cart" });
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

const contactText = `<p>Hi! This page was made by Sam Ettinger (he/him). I'm an out-of-work electronics/IoT/web dev. Feel free to contact me if you find an issue with the site, or if you have any questions/comments, or if you can answer some of my questions about TensorFlow.</p>
<div style="display:flex;justify-content:space-evenly"><a href="https://github.com/settinger/thischipdoesnotexist/"><img src="./unsplash/gh.png" alt="GitHub logo" /></a><a href="https://twitter.com/DHammarskjold"><img src="./unsplash/tw.png" alt="Twitter logo" /></a><a href="mailto:ettingersam+chipsite@gmail.com"><img src="./unsplash/em.png" alt="E-mail icon" /></a></div>`;

const aboutText = `<p>This site will look up a particular IC and assure you that, yes, it is in stock. The only problem: it only knows about completely made-up chips that don't exist.</p>

<p>Up until the last minute, the site was going to constantly deliver a "Sorry, out of stock" message and give you a depressingly long lead time. But as the <a href="https://en.wikipedia.org/wiki/2020%E2%80%932021_global_chip_shortage">chip shortage drags on and on</a>, I think we could all use a nice reminder of what it feels like to find a chip listing that <i>isn't</i> out of stock.</p>

<p>More details about how the site works can be found at the <a href="https://github.com/settinger/thischipdoesnotexist/">Github repo</a>. Font and image credits are on the <a href="./credits.html">credits page</a>.

<p>Find and get involved with your local <a href="https://mutualaid.carrd.co/">mutual aid network</a> if you can.</p>`;

const contactMessage = contact.appendHTML("div", { class: "modal-message", text: contactText });
const contactScreen = $("root").appendHTML("div", { class: "smokescreen" });
const aboutMessage = about.appendHTML("div", { class: "modal-message", text: aboutText });
const aboutScreen = $("root").appendHTML("div", { class: "smokescreen" });
let contactAction, aboutAction;

const showContact = () => {
  clearTimeout(contactAction);
  contactScreen.style.pointerEvents = "auto";
  contactScreen.style.opacity = "80%";
  contactScreen.style.zIndex = 19;
  contactMessage.style.pointerEvents = "auto";
  contactMessage.style.opacity = "100%";
  contactMessage.style.top = "50%";
  contactMessage.style.zIndex = 20;
  contact.classList.add("show");
};

const hideContact = () => {
  contactScreen.style.zIndex = 9;
  contactScreen.style.pointerEvents = "none";
  contactScreen.style.opacity = "0%";
  contactMessage.style.zIndex = 10;
  contactMessage.style.pointerEvents = "none";
  contactMessage.style.opacity = "0%";
  contactMessage.style.top = "40%";
  contact.classList.remove("show");
  contactAction = setTimeout(() => {
    contactScreen.style.zIndex = -9;
    contactMessage.style.zIndex = -10;
  }, 500);
};

const showAbout = () => {
  clearTimeout(aboutAction);
  aboutScreen.style.pointerEvents = "auto";
  aboutScreen.style.opacity = "80%";
  aboutScreen.style.zIndex = 19;
  aboutMessage.style.pointerEvents = "auto";
  aboutMessage.style.opacity = "100%";
  aboutMessage.style.top = "50%";
  aboutMessage.style.zIndex = 20;
  about.classList.add("show");
};

const hideAbout = () => {
  aboutScreen.style.zIndex = 9;
  aboutScreen.style.pointerEvents = "none";
  aboutScreen.style.opacity = "0%";
  aboutMessage.style.zIndex = 10;
  aboutMessage.style.pointerEvents = "none";
  aboutMessage.style.opacity = "0%";
  aboutMessage.style.top = "40%";
  about.classList.remove("show");
  aboutAction = setTimeout(() => {
    aboutScreen.style.zIndex = -9;
    aboutMessage.style.zIndex = -10;
  }, 500);
};

contact.addEventListener("click", showContact);
contactScreen.addEventListener("click", hideContact);
about.addEventListener("click", showAbout);
aboutScreen.addEventListener("click", hideAbout);
