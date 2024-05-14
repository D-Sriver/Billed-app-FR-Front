/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";

import router from "../app/Router.js";

import "@testing-library/jest-dom/extend-expect";

jest.mock("../app/Store", () => mockStore);

const $ = require("jquery");
global.$ = global.jQuery = $;
$.fn.modal = jest.fn();

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // ajout du test [cover Ligne 20] si je clique sur le bouton « Nouvelle facture » accéder à la page Nouvelle facture.
    test("Then if I click the 'New Bill' button I should navigate to the New Bill page", async () => {
      Object.defineProperty(window, "localStorage", {
        // définir une valeur pour localStorage
        value: localStorageMock,
      });
      //si je suis connecté en tant que type "employee"
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      //créer un élément div
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = jest.fn();
      // créer une instance de la classe Bills
      new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      // récupérer le bouton "Nouvelle facture"
      const newBillBtn = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillBtn);
      // espère que la fonction onNavigate ait été appelée avec l'argument "#employee/bill/new"
      expect(onNavigate).toHaveBeenLastCalledWith("#employee/bill/new");
    });
    // ajout du test [cover Ligne 24-27] si je clique sur l'icône d'oeil, la modale doit s'afficher
    test("Then clicking an eye icon should display the modal", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      //si je suis connecté en tant que type "employee"
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = jest.fn();
      // créer une instance de la classe Bills
      new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      // récupérer le premier icône d'oeil
      const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
      // attendre que l'icône d'oeil soit dans le document
      await waitFor(() =>
        // espère que l'icône d'oeil est dans le document
        expect(firstEyeIcon).toBeInTheDocument()
      );
      // cliquer sur l'icône d'oeil
      fireEvent.click(firstEyeIcon);
    });
  });
});

//Test GET

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));
      await waitFor(() => screen.getByText("Nouvelle note de frais"));
      await waitFor(() => screen.getAllByText("Type"));
      await waitFor(() => screen.getAllByText("Nom"));
      await waitFor(() => screen.getAllByText("Date"));
      await waitFor(() => screen.getAllByText("Montant"));
      await waitFor(() => screen.getAllByText("Statut"));
      await waitFor(() => screen.getAllByText("Actions"));
    });

    // erreur api
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      // test d'erreur 404
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
      // test d'erreur 500
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
