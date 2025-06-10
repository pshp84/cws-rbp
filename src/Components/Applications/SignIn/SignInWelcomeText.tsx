import Link from "next/link"

const SignInWelcomeText = () => {
    return <div className="sign-in-welcome-text">
        <h2 className="text-primary mb-2 ff-sora-semibold">Welcome to RBP Club</h2>
        <p className="mb-1">Your gateway to exclusive benefits and unbeatable savings designed for renters.</p>
        <p className="mb-2">Access deep discounts on everyday essentials, build your credit, and simplify your life—all in one place.</p>
        <p className="mb-2 ff-sora-semibold">Discover perks like:</p>
        <ul className="mb-3">
            <li>- Discounts on electronics, clothing, and home essentials.</li>
            <li>- Credit-building through on-time rent payments.</li>
            <li>- Simplified home management with utility setup and HVAC delivery.</li>
        </ul>
        <p className="mb-1">Not a member yet?</p>
        <p className="m-0"><Link className="ff-sora-semibold" href={`/sign-up`}>Sign up</Link> now to unlock smarter renting benefits for just <span className="ff-sora-semibold">$5/month</span>!</p>
    </div>
}

export default SignInWelcomeText