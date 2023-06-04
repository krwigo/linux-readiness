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

const randomSort = (a, b) => (Math.random() < 0.5 ? 1 : -1);

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
        HOSTNAME: "debian",
        PROMPTSU: "$",
      }
    );
    const typed = new Typed(el.current, {
      strings: [render.strings],
    });
    return () => typed.destroy();
  }, [data]);

  return (
    <>
      <div className="terminal">
        <div className="toolbar">
          <button />
          <button />
          <button />
        </div>
        <div className="typer">
          <span ref={el} />
        </div>
      </div>
    </>
  );
}

function Card({ data, onNext }) {
  const [time, setTime] = useState(90);

  const [reveal, setReveal] = useState(false);

  const [explain, setExplain] = useState(false);

  const [guesses, setGuesses] = useState([]);

  const [choices, setChoices] = useState([]);

  useEffect(() => {
    const id = setInterval(
      () => setTime((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [data]);

  useEffect(() => {
    setTime(90);
    setReveal(false);
    setExplain(false);
    setGuesses([]);
    setChoices(data.accept.concat(data.reject).sort(randomSort));
  }, [data]);

  return (
    <div className="container">
      <div className="prompt">{data.prompt}</div>
      <div className={`choices reveal-${reveal}`}>
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
        <div className="buttons">
          {reveal && (
            <Button variant="primary" onClick={onNext}>
              Next
            </Button>
          )}
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
          <Button
            variant="secondary"
            onClick={() => {
              setExplain((prev) => !prev);
            }}
          >
            Explain
          </Button>
        </div>
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

function updateTheme() {
  const colorMode =
    window.matchMedia("(prefers-color-scheme: dark)").matches ||
    localStorage.getItem("theme") == "dark"
      ? "dark"
      : "light";
  document.documentElement.setAttribute("data-bs-theme", colorMode);
}

function Main() {
  const [value, setValue] = useState(1);

  const [index, setIndex] = useState(0);

  const onNext = useCallback((ev) =>
    setIndex((prev) => (prev + 1) % dataset.length)
  );

  const onClick = useCallback((ev) => setValue((prev) => prev + 1));

  useEffect(() => {
    updateTheme();
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    m.addEventListener("change", updateTheme);
    return () => m.removeEventListener("change", updateTheme);
  }, []);

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
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            let dark = localStorage.getItem("theme") == "dark";
            updateTheme(localStorage.setItem("theme", dark ? "" : "dark"));
          }}
        >
          Theme
        </a>
      </div>
      {dataset.slice(index, index + 1).map((data, i) => (
        <Card key={i} data={data} onNext={onNext} />
      ))}
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
