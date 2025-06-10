import { useEffect, useRef, useState } from 'react';

interface BanquestCreditCardFormProps {
    triggerCharge: boolean;
    onTokenizationComplete: (
        token: string,
        expiryMonth: number,
        expiryYear: number
    ) => Promise<void> | void;
}

const BanquestCreditCardForm = ({ triggerCharge, onTokenizationComplete }: BanquestCreditCardFormProps) => {
    const [errorMessage, setErrorMessage] = useState('');
    const [isReady, setIsReady] = useState(false);
    const cardContainerRef = useRef<HTMLDivElement | null>(null);
    const [cardForm, setCardForm] = useState<any>(null);
    const publicSourceKey = process.env.NEXT_PUBLIC_BANQUEST_TOKENIZATION_KEY;

    // Initialize the card form once the script is loaded
    const initializeForm = () => {
        if (cardForm) {
            cardForm.unmount?.();
            setCardForm(null);
        }

        const loadHostedTokenization = async () => {
            if (typeof window.HostedTokenization === 'undefined') return;

            const hostedTokenization = new window.HostedTokenization(publicSourceKey);
            const inputStyle = 'border: 1px dashed rgba(94, 128, 250, 0.5); border-radius: 6px; padding: 10px 12px; font-size: 16px; color: rgb(33, 37, 41); background-color: rgb(255, 255, 255); margin-right: 10px;';
            const form = hostedTokenization
                .create('card-form')
                .mount(cardContainerRef.current!)
                .on('change', (event: any) => {
                    if (event.error) {
                        setErrorMessage(event.error);
                    }
                })
                .setStyles({
                    container: '',
                    card: `${inputStyle} width: calc(100% - 26px); margin-bottom: 1rem; margin-right: 0px;`,
                    expiryContainer: `${inputStyle} padding-top:9px; padding-bottom:9px; display: inline-flex;`,
                    cvv2: inputStyle,
                    avsZip: inputStyle,
                    labels: 'color: rgb(61, 67, 74); font-size: 13px;',
                });

            setCardForm(form);
            setIsReady(true);
        };

        loadHostedTokenization();
    };

    useEffect(() => {
        // Initialize the form when the component is mounted
        initializeForm();

        return () => {
            if (cardForm) {
                cardForm.unmount?.();
            }
        };
    }, []); // Only run on mount

    useEffect(() => {
        const handleTokenization = async () => {
            if (!cardForm || !isReady) return;

            try {
                const data = await cardForm.getNonceToken();
                if (data.nonce) {
                    await onTokenizationComplete(data.nonce, data.expiryMonth, data.expiryYear);
                } else {
                    setErrorMessage('Something is wrong! please try again');
                    console.error('Nonce token is not generated');
                }
            } catch (error: any) {
                setErrorMessage(error.message);
                console.error(error);
            }
        };

        if (triggerCharge && isReady) {
            setErrorMessage('');
            handleTokenization();
        }
    }, [triggerCharge, cardForm, onTokenizationComplete, isReady]);

    useEffect(() => {
        const container = document.getElementById('banquest-credit-card-container');
        if (container) {
            const iframe = container.querySelector('iframe');
            
            if (iframe) {
                iframe.onload = () => {
                    // Send a message to the iframe to apply styles
                    iframe.contentWindow?.postMessage(
                        {
                            type: 'APPLY_STYLES',
                            styles: {
                                body: {
                                    backgroundColor: 'lightblue',
                                },
                                h1: {
                                    color: 'red',
                                },
                            },
                        },
                        '*'
                    );
                };
            }
        }
    }, []);

    return (
        <>
            <div id="banquest-credit-card-container" ref={cardContainerRef}></div>
            {errorMessage && <div className="alert alert-danger rounded-3 banquest-credit-card-error">{errorMessage}</div>}
        </>
    );
};

export default BanquestCreditCardForm;
