import { FC, PropsWithChildren, useCallback } from "react"

import { LoadAnimation, PuppySleep, PuppyWag } from "assets"
import "./Loader.scss"

type Props = { text?: string; loading: boolean; animation?: 0 | 1 | 2 }

const Loader: FC<PropsWithChildren<Props>> = ({ text, loading, children, animation }) => {
  const options = [PuppySleep, PuppyWag, LoadAnimation]

  const LoadingAnimation = useCallback(() => options[Math.floor(Math.random() * options.length)], [loading])

  return loading ? (
    <div className='loader'>
      <img src={animation ? options[animation] : LoadingAnimation()} alt='Loading...' className='loader__animation' />
      {text && <p className='loader__text'>{text}</p>}
    </div>
  ) : (
    <>{children}</>
  )
}

export default Loader
