import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoaderProps {
  isLoading: boolean;
  message?: string;
}

// Separating the logo into border and inner paths for independent styling
const LOGO_BORDER = "M428.362 1.06836H428.38L428.398 1.06934C445.529 2.38716 463.928 11.6021 478.953 25.8398C493.748 39.8592 505.31 58.7848 509.178 79.9336L509.356 80.9424L509.363 80.9814V81.0215L512.5 422.901V422.951L512.491 423C507.811 447.486 499.576 466.261 485.905 480.758C472.236 495.252 453.176 505.423 426.927 512.778L426.86 512.797H88.5049L88.4404 512.779C63.3677 505.982 45.7126 499.51 32.0371 487.712C18.3537 475.906 8.70864 458.816 -0.474609 430.903L-0.5 430.827V83.085L-0.496094 83.0527C2.8801 57.2671 17.4921 37.2673 35.7168 23.2783C53.9357 9.2939 75.7956 1.29144 93.749 -0.49707L93.7754 -0.5H93.8008L428.362 1.06836Z";
const LOGO_INNER = "M84.9346 407.761L84.9355 407.774C85.1891 412.225 87.8321 416.672 90.7812 420.029C92.262 421.715 93.8372 423.146 95.2627 424.185C96.6651 425.206 97.9923 425.901 98.9668 426.017L98.9961 426.02H205.645V393.654H119.53C118.897 393.344 118.547 393.047 118.319 392.688C118.075 392.304 117.934 391.794 117.822 390.983V329.879H84.9346V407.761ZM85.457 308.923H141.392V355.495L141.394 355.519C141.837 360.122 142.711 363.363 144.708 365.658C146.71 367.959 149.766 369.222 154.346 370.076L154.392 370.085H225.555V426.02H247.465V338.243H175.896C174.516 338.117 173.767 337.874 173.34 337.458C172.928 337.056 172.71 336.385 172.711 335.084V278.129L85.457 277.601V308.923ZM392.836 390.452C392.707 391.325 392.511 391.838 392.202 392.204C391.898 392.565 391.433 392.843 390.633 393.132H268.943V426.02H409.654L409.756 425.971C413.607 424.135 416.437 422.424 418.753 420.085C421.071 417.744 422.846 414.803 424.639 410.554L424.678 410.461V273.944H392.836V390.452ZM337.946 334.018C337.854 335.726 337.524 336.653 336.935 337.214C336.335 337.785 335.364 338.08 333.711 338.243H268.421V371.134L354.655 370.607H354.738L354.816 370.58C360.846 368.483 364.447 366.453 366.608 363.705C368.776 360.95 369.436 357.548 369.788 352.895L369.789 352.876V273.944H336.893L337.946 334.018ZM156.502 143.78C150.978 144.084 147.07 144.964 144.544 147.497C142.173 149.875 141.119 153.607 140.901 159.309L140.869 160.476V258.217H173.234V178.293C173.396 177.022 173.679 176.337 174.116 175.916C174.556 175.492 175.239 175.251 176.424 175.099L242.237 176.152V143.779H156.516L156.502 143.78ZM102.048 88.9033C96.9403 90.1155 93.4183 91.9971 90.9219 94.7422C88.4308 97.4816 87.0075 101.031 85.9932 105.484L85.9805 105.539L85.9795 105.596L85.9805 257.171H117.3V122.412C117.599 121.557 117.747 121.275 117.948 121.119C118.046 121.044 118.184 120.977 118.433 120.914C118.681 120.851 119.001 120.802 119.449 120.734L241.214 120.732L241.714 120.733L241.713 88.8906H102.104L102.048 88.9033ZM263.193 88.3682V176.145H334.277C335.493 176.115 336.103 176.242 336.448 176.63C336.623 176.827 336.772 177.137 336.858 177.654C336.945 178.173 336.963 178.868 336.902 179.794L336.901 179.811V253.512H424.678V221.67H370.312V159.446C370.399 153.182 369.582 149.121 367.234 146.631C364.881 144.134 361.113 143.348 355.706 143.257H284.581V88.3682H263.193ZM305.013 120.211H389.153C390.203 120.245 390.853 120.348 391.311 120.592C391.721 120.811 392.033 121.176 392.312 121.897V201.237H424.671L424.678 200.743V200.68C424.678 200.638 424.68 200.575 424.681 200.492C424.683 200.327 424.685 200.081 424.688 199.761C424.696 199.119 424.706 198.176 424.72 196.975C424.746 194.571 424.783 191.128 424.824 186.971C424.906 178.655 425.004 167.481 425.069 156.045C425.135 144.609 425.167 132.91 425.118 123.547C425.069 114.206 424.94 107.141 424.674 105.012C424.141 100.748 422.763 97.5067 420.307 94.8662C417.862 92.2384 414.384 90.2447 409.724 88.4033L409.636 88.3682H305.013V120.211Z";

export const Loader: React.FC<LoaderProps> = ({ 
  isLoading, 
  message = "Loading" 
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-3xl transition-all duration-700"
        >
          {/* Background Atmospheric Glows */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.03, 0.1, 0.03] 
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary-500/5 dark:bg-blue-500/5 rounded-full blur-[180px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.03, 0.1, 0.03] 
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary-500/5 dark:bg-blue-500/5 rounded-full blur-[180px]" 
          />

          <div className="relative flex flex-col items-center">
            {/* Logo Section */}
            <div className="relative flex items-center justify-center">
              {/* Pulsating Expanding Circles */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0.4 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    delay: i * 1.3,
                    ease: "easeOut" 
                  }}
                  className="absolute size-20 rounded-full border border-primary-500/20 dark:border-blue-400/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                />
              ))}

              {/* Central Logo Box */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="relative flex aspect-square size-[68px] items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                <div className="size-16 flex items-center justify-center">
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 512 512" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full relative z-10"
                  >
                    <defs>
                      <mask id="fill-mask">
                        <motion.circle 
                          cx="256" 
                          cy="256" 
                          r="400"
                          fill="white"
                          initial={{ scale: 0 }}
                          animate={{ 
                            scale: [0, 0, 1, 1, 0, 0],
                          }}
                          transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            times: [0, 0.4, 0.6, 0.8, 0.95, 1],
                            ease: "easeInOut"
                          }}
                        />
                      </mask>
                    </defs>

                    {/* THICK Border Path Outline */}
                    <motion.path
                      d={LOGO_BORDER}
                      stroke="#074B89"
                      strokeWidth="24" // Significantly thicker border
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ 
                        pathLength: [0, 1, 1, 1, 0],
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        times: [0, 0.4, 0.4, 0.8, 1],
                        ease: "easeInOut"
                      }}
                    />

                    {/* Standard Inner Lines Outline */}
                    <motion.path
                      d={LOGO_INNER}
                      stroke="#074B89"
                      strokeWidth="10" // Original balanced thickness for inner detail
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ 
                        pathLength: [0, 1, 1, 1, 0],
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        times: [0, 0.4, 0.4, 0.8, 1],
                        ease: "easeInOut"
                      }}
                    />

                    {/* The Full Filled Path (Masked Inside-Out) */}
                    <motion.path
                      d={`${LOGO_BORDER} ${LOGO_INNER}`}
                      fill="#074B89"
                      mask="url(#fill-mask)"
                    />
                  </svg>
                </div>
              </motion.div>
            </div>

            {/* Text Area */}
            <div className="mt-10 flex flex-col items-center">
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl font-black tracking-[0.4em] text-slate-900 dark:text-white uppercase text-center relative"
              >
                Finventree
                <motion.div 
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent -skew-x-12"
                />
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-3 mt-3"
              >
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((delay) => (
                    <motion.span 
                      key={delay}
                      animate={{ 
                        y: [0, -3, 0],
                        opacity: [0.4, 1, 0.4]
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay }}
                      className="size-1 rounded-full bg-primary-500" 
                    />
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500 dark:text-slate-400">
                  {message}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
