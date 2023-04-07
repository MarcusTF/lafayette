import { PuppyError } from "assets"
import { ToastOptions, toast } from "react-toastify"

export const errorToast = (message: string, id: string, options?: ToastOptions) =>
  toast.error(message, {
    toastId: id,
    icon: <img src={PuppyError} alt='Puppy Error' width='30' />,
    ...(options || {}),
  })
