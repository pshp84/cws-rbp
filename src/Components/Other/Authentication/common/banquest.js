
// import { tokenizationKey } from "@/app/api/v1/banquest/banquestConfig";
// import { registerCustomer } from "@/services/customers";
import { useEffect, useRef, useState } from "react";

export default function BanquestFile() {

    const [email, setEmail] = useState("brian@cwsdevelopers.com");
    const [password, setPassword] = useState("5Nm9z67>|");
    const [address, setAddress] = useState({
        firstName: "Brian",
        lastName: "W3 Dev",
        street: "525 Considine Shoal Apt. 613",
        street2: "Jerde Springs",
        state: "Maryland",
        city: "South Norrisland",
        zipCode: "93671",
        country: "United States"
    });
    const [errorMessage, setErrorMessage] = useState('');
    const cardFormRef = useRef(null);

    async function signUp() {
        setErrorMessage("");

        if (cardFormRef.current) {
            const cardFormData = await cardFormRef.current.getNonceToken();
            const { nonce, expiryMonth, expiryYear } = cardFormData;
            if (!nonce || !expiryMonth || !expiryYear) {
                setErrorMessage("Something is wrong, please try again");
                return;
            }
            // const registerData = await registerCustomer({
            //     email,
            //     password,
            //     address,
            //     creditCardNonceToken: nonce,
            //     expiryMonth,
            //     expiryYear
            // });

            // if (!registerData.status) {
            //     setErrorMessage(registerData.message);
            //     return;
            // }
                

        }

    }

    function formHandler(e) {
        e.preventDefault();
        signUp();
    }

    function handleChangeEvent(event) {
        setErrorMessage(event.error || '');
    }

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://tokenization.sandbox.banquestgateway.com/tokenization/v0.2';
        script.async = true;
        script.onload = () => {
            const hostedTokenization = new window.HostedTokenization(process.env.NEXT_PUBLIC_BANQUEST_TOKENIZATION_KEY);
            cardFormRef.current = hostedTokenization.create('card-form')
                .mount('#ccContainer')
                .on('change', handleChangeEvent);
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            if (cardFormRef.current) {
                cardFormRef.current.unmount();
            }
        };
    }, []);

    return (
        <div id="ccContainer">

        </div>
        // <div className="login-register-form py-5">
        //     <div className="container">
        //         <div className="row">
        //             <div className="col-md-4 mx-auto">
        //                 <h2 className="mb-4">Register</h2>
        //                 {errorMessage != "" &&
        //                     <div className="alert alert-danger">{errorMessage}</div>
        //                 }
        //                 <form onSubmit={formHandler}>
        //                     <div className="mb-2">
        //                         <label htmlFor="email" className="form-label">Email:</label>
        //                         <input type="email" className="form-control" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        //                     </div>
        //                     <div className="mb-3">
        //                         <label htmlFor="password" className="form-label">Password:</label>
        //                         <input type="password" className="form-control" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        //                     </div>
        //                     <div className="d-flex gap-2">
        //                         <div className="mb-2">
        //                             <label htmlFor="firstName" className="form-label">First Name:</label>
        //                             <input type="text" className="form-control" id="firstName" value={address.firstName} onChange={(e) => setAddress({ ...address, firstName: e.target.value })} />
        //                         </div>
        //                         <div className="mb-2">
        //                             <label htmlFor="lastName" className="form-label">Last Name:</label>
        //                             <input type="text" className="form-control" id="lastName" value={address.lastName} onChange={(e) => setAddress({ ...address, lastName: e.target.value })} />
        //                         </div>
        //                     </div>
        //                     <div className="mb-2">
        //                         <label htmlFor="streetAddress1" className="form-label">Street:</label>
        //                         <input type="text" className="form-control" id="streetAddress1" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
        //                     </div>
        //                     <div className="mb-2">
        //                         <label htmlFor="streetAddress2" className="form-label">Street 2:</label>
        //                         <input type="text" className="form-control" id="streetAddress2" value={address.street2} onChange={(e) => setAddress({ ...address, street2: e.target.value })} />
        //                     </div>

        //                     <div className="d-flex gap-2">
        //                         <div className="mb-2">
        //                             <label htmlFor="stateAddress" className="form-label">State:</label>
        //                             <input type="text" className="form-control" id="stateAddress" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
        //                         </div>
        //                         <div className="mb-2">
        //                             <label htmlFor="cityAddress" className="form-label">City:</label>
        //                             <input type="text" className="form-control" id="cityAddress" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
        //                         </div>
        //                     </div>

        //                     <div className="d-flex gap-2">
        //                         <div className="mb-2">
        //                             <label htmlFor="zipAddress" className="form-label">Zip:</label>
        //                             <input type="text" className="form-control" id="zipAddress" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
        //                         </div>
        //                         <div className="mb-2">
        //                             <label htmlFor="countryAddress" className="form-label">Country:</label>
        //                             <input type="text" className="form-control" id="countryAddress" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
        //                         </div>
        //                     </div>
        //                     <div className="mb-3" id="ccContainer"></div>
        //                     <button type="submit" className="btn btn-primary">Register</button>
        //                 </form>
        //             </div>
        //         </div>
        //     </div>
        // </div>
    )
}