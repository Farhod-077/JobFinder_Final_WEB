import { setupValidation } from './forms.js';

export function initContactForm() {
    setupValidation(document.getElementById("contact-form"), "contact", values => {
        const success = document.getElementById("contact-success");

        success.textContent =
            `Thank you, ${values.fullName}. Your form passed validation. Demo mode: no message was sent or stored.`;

        success.hidden = false;
    });
}
