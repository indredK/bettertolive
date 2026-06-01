import { render, screen } from "@testing-library/react"
import App from "./App"

describe("App", () => {
  it("renders the greeting form", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", { name: "Welcome to Tauri + React" }),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Enter a name...")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Greet" })).toBeInTheDocument()
  })
})
