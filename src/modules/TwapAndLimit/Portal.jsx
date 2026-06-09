/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import { createPortal } from 'react-dom'

export function Portal({ children, container }) {
  if (typeof document === 'undefined') return null

  const el = typeof container === 'function' ? container() : container
  return createPortal(children, el ?? document.body)
}
