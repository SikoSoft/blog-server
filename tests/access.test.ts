import axios from "axios";

describe("Access verification", () => {
  test("admin token should receive admin role", async () => {
    const response = await axios.post<any>(
      "http://localhost:7777/api/useToken",
      {
        code: "admin",
      }
    );
    expect(response.data.role).toBe(1);
  });

  test("guest token should receive guest role", async () => {
    const response = await axios.post<any>(
      "http://localhost:7777/api/useToken",
      {
        code: "guest",
      }
    );
    expect(response.data.role).toBe(2);
  });
});
