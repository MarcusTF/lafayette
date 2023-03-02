import { PuppyError } from "assets"

import "./Error.scss"

const Error = () => {
  return (
    <main className='error'>
      <img src={PuppyError} alt='embarrassed puppy' />
      <h1 className='error__title'>Oops! Something went wrong.</h1>
      <p>
        If you're seeing this, please send a message to my dad,{" "}
        <a href='slack://user?team=T02G93X17&id=U025C85LM6U' className='link'>
          @Marcus
        </a>{" "}
        in the Haneke Slack or email him at{" "}
        <a href='mailto:mfernandez@hanekedesign.com' className='email'>
          mfernandez@hanekedesign.com
        </a>
      </p>
    </main>
  )
}

export default Error
