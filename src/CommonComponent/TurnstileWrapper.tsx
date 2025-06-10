import { useEffect, useRef, useState } from "react";

interface TurnstileWrapperProps {
    className?: string;
    onVerify: (token: string) => void;
}

const MAX_RETRIES = 3; // Maximum number of retries
const RETRY_DELAY = 500; // Delay between retries in milliseconds

const TurnstileWrapper: React.FC<TurnstileWrapperProps> = (props) => {
    const { onVerify, className = "" } = props;
    const turnstileRef = useRef<HTMLDivElement>(null);
    const [retryCount, setRetryCount] = useState(0);

    const renderTurnstile = () => {
        if (turnstileRef.current && typeof window !== "undefined" && window.turnstile) {
            window.turnstile.render(turnstileRef.current, {
                sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
                callback: (generatedToken: string) => {
                    onVerify(generatedToken);
                },
                "expired-callback": () => {
                    onVerify("");
                },
            });
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined" && window.turnstile) {
            renderTurnstile();
        } else if (retryCount < MAX_RETRIES) {
            const timer = setTimeout(() => {
                setRetryCount((prev) => prev + 1);
            }, RETRY_DELAY);

            return () => clearTimeout(timer); // Cleanup timeout
        } else {
            console.error("Turnstile script failed to initialize.");
        }
    }, [retryCount, onVerify]);

    // Reset retryCount when the component unmounts
    useEffect(() => {
        return () => {
            setRetryCount(0);
        };
    }, []);

    return <div className={`turnstile-wrapper ${className}`} ref={turnstileRef}></div>;
};

export default TurnstileWrapper;
