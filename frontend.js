import React, { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// ref: https://mattboldt.github.io/typed.js/docs/
import Typed from "typed.js";

// ref: https://react-bootstrap.github.io/components/buttons/
import { Button } from "react-bootstrap";

// ref: https://icons.getbootstrap.com/
// import { Trash, ToggleOn, ToggleOff } from "react-bootstrap-icons";

import "bootstrap/dist/css/bootstrap.min.css";
import "./frontend.css";

import dataset from "./dataset.json";

const recurseEnv = (env, src, name) =>
  src.replaceAll(/\$([A-Z0-9]+)/g, (whole, name) =>
    recurseEnv(env, env[name] || "")
  );

const randomSort = (a, b) => Math.random() - 0.5;

function Typer({ data }) {
  const el = useRef(null);

  useEffect(() => {
    const render = data.terminal.reduce(
      (o, c) => {
        if (c.toLowerCase) {
          c = recurseEnv(o, c);
          if (o.strings) o.strings += "<br/>";
          o.strings += c;
        } else {
          Object.assign(o, c);
        }
        return o;
      },
      {
        strings: "",
        PS1: "<span class='user'>$USERNAME@$HOSTNAME:</span><span class='path'>$PWD</span><span class='access'>$PROMPTSU</span> ",
        PWD: "/boot",
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        HOME: "/home/myuser",
        USERNAME: "user",
        GROUPNAME: "users",
        HOSTNAME: "debian",
        PROMPTSU: "$",
      }
    );
    const typed = new Typed(el.current, {
      strings: [render.strings],
      typeSpeed: +localStorage.getItem("speed") || 0,
    });
    return () => typed.destroy();
  }, [data]);

  return (
    <>
      <div className="terminal">
        <div className="toolbar">
          <button
            onClick={() => localStorage.setItem("speed", "-1000")}
            title="Fast"
          />
          <button
            onClick={() => localStorage.setItem("speed", "0")}
            title="Normal"
          />
          <button
            onClick={() => localStorage.setItem("speed", "80")}
            title="Slow"
          />
        </div>
        <div className="typer">
          <span ref={el} />
        </div>
      </div>
    </>
  );
}

function CardText({ data, config, onNext }) {
  const [time, setTime] = useState(90);

  const [reveal, setReveal] = useState(false);

  const [explain, setExplain] = useState(false);

  const [guess, setGuess] = useState("");

  useEffect(() => {
    const id = setInterval(
      () => setTime((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [config.dataindex]);

  useEffect(() => {
    setTime(90);
    setReveal(false);
    setExplain(false);
    setGuess("");
  }, [config.dataindex]);

  const cmp = data?.caseSensitive
    ? (x) => data.accept.includes(x.trim())
    : (x) =>
        data.accept
          .map((y) => y.toLowerCase())
          .includes(x.trim().toLowerCase());

  return (
    <div className="container cardtext">
      <div className="prompt">{data.promptText || data.prompt}</div>
      <div className={`reveal-${reveal}`}>
        <label className={`choice guess-${!!guess} accept-${cmp(guess)}`}>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          {reveal && <div>{data.accept.join(", ")}</div>}
        </label>
      </div>
      <div className="buttons">
        {reveal && (
          <Button variant="primary" onClick={onNext}>
            Next
          </Button>
        )}
        {!reveal && (
          <Button
            variant={time >= 20 ? "primary" : time > 0 ? "warning" : "danger"}
            onClick={() => {
              setTime(0);
              setExplain(true);
              setReveal((prev) => !prev);
            }}
          >
            Reveal ({time})
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setExplain((prev) => !prev);
          }}
        >
          Explain
        </Button>
      </div>
      {explain && (
        <div className="explain">
          <p dangerouslySetInnerHTML={{ __html: data.explain }}></p>
          {data.links?.length && (
            <ul>
              {data.links.map((x, i) => (
                <li key={i}>
                  <a target="_blank" href={x?.href}>
                    {x?.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Typer data={data} />
        </div>
      )}
    </div>
  );
}

function CardCheck({ data, config, onNext }) {
  const [time, setTime] = useState(90);

  const [reveal, setReveal] = useState(false);

  const [explain, setExplain] = useState(false);

  const [guesses, setGuesses] = useState([]);

  const [choices, setChoices] = useState([]);

  const textMap = {
    0: "ZERO",
    1: "ONE",
    2: "TWO",
    3: "THREE",
    4: "FOUR",
    5: "FIVE",
  };

  useEffect(() => {
    const id = setInterval(
      () => setTime((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [config.dataindex]);

  useEffect(() => {
    setTime(90);
    setReveal(false);
    setExplain(false);
    setGuesses([]);
    setChoices(
      data.accept
        .concat(data.reject.sort(randomSort))
        .slice(0, 5)
        .sort(randomSort)
    );
  }, [config.dataindex]);

  return (
    <div className="container cardcheck">
      <div className="prompt">
        {data.promptCheck || data.prompt} (Choose {textMap[data.accept.length]})
      </div>
      <div className={`reveal-${reveal}`}>
        {choices.map((x, i) => (
          <label
            key={i}
            className={`choice guess-${guesses.includes(
              x
            )} accept-${data.accept.includes(x)}`}
            htmlFor={`choice${i}`}
          >
            <input
              type="checkbox"
              id={`choice${i}`}
              checked={guesses.includes(x)}
              onChange={(e) => {
                if (e.target.checked) {
                  setGuesses((prev) => prev.concat([x]));
                } else {
                  setGuesses((prev) => prev.filter((y) => y != x));
                }
              }}
            />{" "}
            {x}
          </label>
        ))}
      </div>
      <div className="buttons">
        {reveal && (
          <Button variant="primary" onClick={onNext}>
            Next
          </Button>
        )}
        {!reveal && (
          <Button
            variant={time >= 20 ? "primary" : time > 0 ? "warning" : "danger"}
            onClick={() => {
              setTime(0);
              setExplain(true);
              setReveal((prev) => !prev);
            }}
          >
            Reveal ({time})
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setExplain((prev) => !prev);
          }}
        >
          Explain
        </Button>
      </div>
      {explain && (
        <div className="explain">
          <p dangerouslySetInnerHTML={{ __html: data.explain }}></p>
          {data.links?.length && (
            <ul>
              {data.links.map((x, i) => (
                <li key={i}>
                  <a target="_blank" href={x?.href}>
                    {x?.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Typer data={data} />
        </div>
      )}
    </div>
  );
}

function CardRadio({ data, config, onNext }) {
  const [time, setTime] = useState(90);

  const [reveal, setReveal] = useState(false);

  const [explain, setExplain] = useState(false);

  const [guess, setGuess] = useState("");

  const [choices, setChoices] = useState([]);

  useEffect(() => {
    const id = setInterval(
      () => setTime((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [config.dataindex]);

  useEffect(() => {
    setTime(90);
    setReveal(false);
    setExplain(false);
    setGuess("");
    setChoices(
      data.accept
        .sort(randomSort)
        .slice(0, 1)
        .concat(data.reject.sort(randomSort))
        .slice(0, 5)
        .sort(randomSort)
    );
  }, [config.dataindex]);

  return (
    <div className="container cardradio">
      <div className="prompt">{data.promptCheck || data.prompt}</div>
      <div className={`reveal-${reveal}`}>
        {choices.map((x, i) => (
          <label
            key={i}
            className={`choice guess-${
              guess == x
            } accept-${data.accept.includes(x)}`}
            htmlFor={`choice${i}`}
          >
            <input
              type="radio"
              name="radio"
              id={`choice${i}`}
              value={x}
              checked={guess == x}
              onChange={(e) => setGuess(x)}
            />{" "}
            {x}
          </label>
        ))}
      </div>
      <div className="buttons">
        {reveal && (
          <Button variant="primary" onClick={onNext}>
            Next
          </Button>
        )}
        {!reveal && (
          <Button
            variant={time >= 20 ? "primary" : time > 0 ? "warning" : "danger"}
            onClick={() => {
              setTime(0);
              setExplain(true);
              setReveal((prev) => !prev);
            }}
          >
            Reveal ({time})
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setExplain((prev) => !prev);
          }}
        >
          Explain
        </Button>
      </div>
      {explain && (
        <div className="explain">
          <p dangerouslySetInnerHTML={{ __html: data.explain }}></p>
          {data.links?.length && (
            <ul>
              {data.links.map((x, i) => (
                <li key={i}>
                  <a target="_blank" href={x?.href}>
                    {x?.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Typer data={data} />
        </div>
      )}
    </div>
  );
}

const themes = ["auto", "light", "dark"];

function Main() {
  const [config, setConfig] = useState({
    dataindex: 0,
    styleindex: 0,
    styles: ["cardtext"],
  });

  const onNext = useCallback(() =>
    setConfig((prev) => {
      let next = Object.assign({}, prev);
      next.dataindex += 1;
      next.data = dataset[next.dataindex % dataset.length];
      next.styleindex += 1;
      next.style = next.styles[next.styleindex % next.styles.length];
      for (let i = 0; i < dataset.length; i++) {
        if (
          // suggestion: skip cardcheck if next.data.accept.length <= 1
          // (next.style == "cardcheck" && next.data?.accept?.length <= 0) ||
          (next.data?.styleRequire?.includes &&
            !next.data.styleRequire.includes(next.style)) ||
          (next.data?.styleIgnore?.includes &&
            next.data.styleIgnore.includes(next.style))
        ) {
          next.dataindex += 1;
          next.data = dataset[next.dataindex % dataset.length];
          continue;
        }
        break;
      }
      return next;
    })
  );

  useEffect(() => {
    setConfig({
      dataindex: -1,
      styleindex: -1,
      styles: []
        .concat(Array(2).fill("cardtext"))
        .concat(Array(8).fill("cardcheck"))
        .concat(Array(30).fill("cardradio"))
        .sort(randomSort),
    });
    onNext();
  }, []);

  const [theme, setTheme] = useState(() => {
    let value = localStorage.getItem("theme");
    return themes.includes(value) ? value : "auto";
  });

  const nextTheme = () =>
    setTheme((prev) => {
      let index = (Math.max(0, themes.indexOf(prev)) + 1) % themes.length;
      let value = themes[index] || "auto";
      localStorage.setItem("theme", value);
      return value;
    });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    document.documentElement.setAttribute(
      "data-bs-theme",
      theme == "auto" && media.matches ? "dark" : theme
    );
    // media.addEventListener("change", console.log);
    // return () => media.removeEventListener("change", console.log);
  }, [theme]);

  return (
    <div>
      <div className="nav">
        <h1>Linux</h1>
        <a
          href="https://www.lpi.org/our-certifications/linux-essentials-overview"
          className="overview"
          target="_blank"
        >
          Overview
        </a>
        <a
          href="https://www.lpi.org/our-certifications/exam-010-objectives"
          className="objectives"
          target="_blank"
        >
          Objectives
        </a>
        <a
          href="https://learning.lpi.org/en/learning-materials/010-160/"
          className="materials"
          target="_blank"
        >
          Materials
        </a>
        <a href="#" onClick={(e) => nextTheme(e.preventDefault())}>
          Theme: {theme}
        </a>
      </div>
      {config.style == "cardtext" && (
        <CardText data={config.data} config={config} onNext={onNext} />
      )}
      {config.style == "cardcheck" && (
        <CardCheck data={config.data} config={config} onNext={onNext} />
      )}
      {config.style == "cardradio" && (
        <CardRadio data={config.data} config={config} onNext={onNext} />
      )}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/*",
    element: <Main />,
  },
]);

function Boot() {
  dataset.sort(randomSort);
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

createRoot(document.querySelector("#app")).render(<Boot />);
