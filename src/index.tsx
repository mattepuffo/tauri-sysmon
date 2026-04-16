/* @refresh reload */
import {render} from "solid-js/web";
import App from "./App";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

render(() => <App/>, document.getElementById("root") as HTMLElement);
