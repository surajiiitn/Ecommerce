const options = {
    key: "rzp_test_TTI0969X0PDtkQ",

    amount: 1000,

    currency: "INR",

    name: "E-commerce Backend",

    description: "Test Payment",

    order_id: "order_TUSUSogjbXEpUy",

    handler: async function (response) {
        console.log("Razorpay response:", response);

        const token = localStorage.getItem("USER1_TOKEN");

        const result = await fetch("/api/v1/payments/verify", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },

            body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
            })
        });

        const data = await result.json();

        console.log("Verification response:", data);

        if (data.success) {
            alert("Payment verified successfully");
        } else {
            alert("Payment verification failed");
        }
    }
};

const razorpay = new Razorpay(options);

document
    .getElementById("payButton")
    .addEventListener("click", function () {
        razorpay.open();
    });