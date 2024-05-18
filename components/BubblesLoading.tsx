import { memo } from 'react'

function BubblesLoading() {
  return (
    <div className="relative -top-[6px] h-8 w-14 fill-red-300">
      <svg viewBox="0 0 32 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="0" cy="12" r="0" transform="translate(8 0)">
          <animate
            attributeName="r"
            begin="0"
            calcMode="spline"
            dur="1.2s"
            keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8"
            keyTimes="0;0.2;0.7;1"
            repeatCount="indefinite"
            values="0; 4; 0; 0"
          />
        </circle>
        <circle cx="0" cy="12" r="0" transform="translate(16 0)">
          <animate
            attributeName="r"
            begin="0.3"
            calcMode="spline"
            dur="1.2s"
            keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8"
            keyTimes="0;0.2;0.7;1"
            repeatCount="indefinite"
            values="0; 4; 0; 0"
          />
        </circle>
        <circle cx="0" cy="12" r="0" transform="translate(24 0)">
          <animate
            attributeName="r"
            begin="0.6"
            calcMode="spline"
            dur="1.2s"
            keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8"
            keyTimes="0;0.2;0.7;1"
            repeatCount="indefinite"
            values="0; 4; 0; 0"
          />
        </circle>
      </svg>
    </div>
  )
}

export default memo(BubblesLoading)
