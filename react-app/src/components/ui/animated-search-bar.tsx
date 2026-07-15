import React, { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Search, Loader2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const destinationsData = [
  { name: "Ladakh", path: "/ladakh" },
  { name: "Kashmir", path: "/kashmir" },
  { name: "Spiti Valley", path: "/spiti" },
  { name: "Uttarakhand", path: "/uttarakhand" },
  { name: "Himachal Pradesh", path: "/himachal" },
  { name: "Rajasthan", path: "/rajasthan" },
  { name: "Kerala", path: "/kerala" },
  { name: "Meghalaya", path: "/meghalaya" },
  { name: "Goa", path: "/goa" },
  { name: "Domestic", path: "/domestic" },
  { name: "International", path: "/international" }
];

const GooeyFilter = () => {
  return (
    <svg aria-hidden="true" style={{ width: 0, height: 0, position: 'absolute' }}>
      <defs>
        <filter id="goo-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
};

const buttonVariants = {
  initial: { x: 0, width: 140 },
  step1: { x: 0, width: 140 },
  step2: { x: -30, width: 240 },
};

const iconVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: { x: 12, opacity: 1 },
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export const isUnsupportedBrowser = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox");
  const isChromeOniOS = ua.includes("crios");
  return isSafari || isChromeOniOS;
};

const getResultItemVariants = (index, isUnsupported) => ({
  initial: {
    y: 0,
    scale: 0.3,
    filter: isUnsupported ? "none" : "blur(10px)",
  },
  animate: {
    y: (index + 1) * 45,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    y: isUnsupported ? 0 : -4,
    scale: 0.8,
    opacity: 0,
  },
});

const getResultItemTransition = (index) => ({
  duration: 0.75,
  delay: index * 0.12,
  type: "spring",
  bounce: 0.35,
  exit: { duration: index * 0.1 },
  filter: { ease: "easeInOut" },
});

export const GooeySearchBar = () => {
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const [state, setState] = useState({
    step: 1,
    searchData: [],
    searchText: "",
    isLoading: false,
  });

  const debouncedSearchText = useDebounce(state.searchText, 300);
  const isUnsupported = useMemo(() => isUnsupportedBrowser(), []);

  const handleButtonClick = () => {
    if (state.step === 1) {
      setState((prevState) => ({ ...prevState, step: 2 }));
    }
  };

  const handleSearch = (e) => {
    setState((prevState) => ({ ...prevState, searchText: e.target.value }));
  };

  const handleSelect = (path) => {
    setState((prevState) => ({ ...prevState, step: 1, searchText: "", searchData: [] }));
    navigate(path);
  };

  useEffect(() => {
    if (state.step === 2) {
      inputRef.current?.focus();
    } else {
      setState((prevState) => ({
        ...prevState,
        searchText: "",
        searchData: [],
        isLoading: false,
      }));
    }
  }, [state.step]);

  useEffect(() => {
    let isCancelled = false;
    if (debouncedSearchText) {
      setState((prevState) => ({ ...prevState, isLoading: true }));
      const fetchData = async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const filteredData = destinationsData.filter((item) =>
            item.name.toLowerCase().includes(debouncedSearchText.trim().toLowerCase())
          );
          if (!isCancelled) {
            setState((prevState) => ({
              ...prevState,
              searchData: filteredData,
              isLoading: false,
            }));
          }
        } catch {
          if (!isCancelled) {
            setState((prevState) => ({ ...prevState, isLoading: false }));
          }
        }
      };
      fetchData();
    } else {
      setState((prevState) => ({
        ...prevState,
        searchData: [],
        isLoading: false,
      }));
    }
    return () => {
      isCancelled = true;
    };
  }, [debouncedSearchText]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (state.step === 2 && !event.target.closest('.gooey-search-container')) {
        setState(prev => ({ ...prev, step: 1 }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.step]);

  return (
    <div className={clsx("relative flex items-center justify-center gooey-search-container h-12 w-[240px]", isUnsupported && "no-goo")} style={{ filter: isUnsupported ? "none" : "url('#goo-effect')" }}>
      <GooeyFilter />

      <div className="relative w-full flex justify-center">
        <motion.div
          className="relative flex items-center justify-center bg-white shadow-md rounded-full h-10 px-4 cursor-pointer overflow-visible z-10"
          initial="initial"
          animate={state.step === 1 ? "step1" : "step2"}
          variants={buttonVariants}
          transition={{ duration: 0.75, type: "spring", bounce: 0.15 }}
          onClick={handleButtonClick}
          style={{ originX: 0.5 }}
        >
          <AnimatePresence mode="popLayout">
            {state.searchData.length > 0 && state.step === 2 && (
              <motion.div
                key="search-text-wrapper"
                className="absolute top-0 left-0 w-full flex flex-col z-[-1]"
                role="listbox"
                aria-label="Search results"
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  delay: isUnsupported ? 0.2 : 0.4,
                  duration: 0.3,
                }}
              >
                <AnimatePresence mode="popLayout">
                  {state.searchData.map((item, index) => (
                    <motion.div
                      key={item.name}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      variants={getResultItemVariants(index, isUnsupported)}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={getResultItemTransition(index)}
                      className="absolute top-0 left-0 w-full bg-white shadow-lg border-x border-b border-gray-100 rounded-b-2xl rounded-t-2xl h-10 px-4 flex items-center cursor-pointer hover:bg-gray-50 text-gray-800"
                      role="option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(item.path);
                      }}
                    >
                      <div className="flex items-center gap-3 w-full mt-1">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.12 + 0.3 }}
                        >
                          <MapPin size={14} className="text-primary" />
                        </motion.div>
                        <motion.span
                          className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis text-gray-800"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.12 + 0.3 }}
                        >
                          {item.name}
                        </motion.span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center w-full h-full relative z-10">
            {state.step === 1 ? (
              <div className="flex items-center justify-center w-full gap-2 text-gray-600 font-medium text-sm">
                <Search size={16} />
                <span>Search</span>
              </div>
            ) : (
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent border-none outline-none text-gray-900 text-sm font-medium pl-2 pr-6"
                placeholder="Type..."
                aria-label="Search input"
                onChange={handleSearch}
                value={state.searchText}
              />
            )}
          </div>

          <AnimatePresence mode="wait">
            {state.step === 2 && (
              <motion.div
                key="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={iconVariants}
                transition={{
                  delay: 0.1,
                  duration: 0.85,
                  type: "spring",
                  bounce: 0.15,
                }}
              >
                {!state.isLoading ? (
                  <Search size={16} />
                ) : (
                  <Loader2 size={16} className="animate-spin text-primary" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
