# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-responsive.spec.cjs >> Mobile Responsiveness Tests >> OSS Section - GitHub icon & Code card >> OSS visual container should be 90vw
- Location: tests\mobile-responsive.spec.cjs:206:5

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 332.5
Received:   244.5625
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - button "PT" [ref=e3] [cursor=pointer]
    - generic [ref=e4]: "|"
    - button "EN" [ref=e5] [cursor=pointer]
  - img
  - navigation [ref=e6]:
    - button [ref=e7] [cursor=pointer]:
      - img [ref=e8]
    - button [ref=e14] [cursor=pointer]:
      - img [ref=e15]
  - generic:
    - generic:
      - generic:
        - link "Funcionalidades":
          - /url: "#features"
        - link "Segurança":
          - /url: "#security"
        - link "Comparação":
          - /url: "#comparison"
        - link "Open Source":
          - /url: "#oss"
        - generic:
          - button "PT"
          - generic: "|"
          - button "EN"
        - button "Back to Top"
  - generic [ref=e16]:
    - heading "Invisível." [level=1] [ref=e19]:
      - generic [ref=e20]: Invisível.
    - img "Ninja Mascot" [ref=e23] [cursor=pointer]
    - generic [ref=e25]:
      - text: 
      - link " Start" [ref=e26] [cursor=pointer]:
        - /url: https://ninjalive.clan.purecore.codes
        - generic [ref=e27]: 
        - text: Start
      - link "Saiba Mais" [ref=e28] [cursor=pointer]:
        - /url: "#features"
  - generic [ref=e29]:
    - heading "Ninja Features" [level=2] [ref=e31]
    - generic [ref=e32]:
      - generic [ref=e33]:
        - generic:
          - generic: 
        - heading "Rede Mesh P2P" [level=3] [ref=e34]
        - paragraph [ref=e35]: Conexões diretas entre participantes, garantindo baixa latência e máxima privacidade.
      - generic [ref=e36]:
        - generic:
          - generic: 
        - heading "Compartilhe sua Tela" [level=3] [ref=e37]
        - paragraph [ref=e38]: Compartilhe apresentações ou seu desktop inteiro com um único clique, em alta definição.
      - generic [ref=e39]:
        - generic:
          - generic: 
        - heading "Tempo Real" [level=3] [ref=e40]
        - paragraph [ref=e41]: Troque mensagens e links durante a chamada. O histórico é apagado assim que a sala fecha.
      - generic [ref=e42]:
        - generic:
          - generic: 
        - heading "VC Admin" [level=3] [ref=e43]
        - paragraph [ref=e44]: "Se você criar a sala, terá poderes especiais: Mute All, silenciar usuários individualmente ou expulsá-los da reunião."
      - generic [ref=e45]:
        - generic:
          - generic: 
        - heading "Transcrição" [level=3] [ref=e46]
        - paragraph [ref=e47]: Transcrição local automática (PT-BR) com opção de baixar o histórico completo da sessão em .txt.
      - generic [ref=e48]:
        - generic:
          - generic: 
        - heading "IA Ninja" [level=3] [ref=e49]
        - paragraph [ref=e50]: Conecte sua própria chave de API para desbloquear chat com IA, tradução simultânea, transcrição avançada e resumos automáticos da reunião.
  - generic [ref=e52]:
    - heading "Atreva-se a Comparar" [level=2] [ref=e53]
    - generic [ref=e54]:
      - generic [ref=e55]:
        - generic [ref=e56]: Armazenamento de Dados
        - generic [ref=e57]:
          - generic [ref=e59]: Zero (P2P) 🟢
          - generic [ref=e61]: Servidores na Nuvem 🔴
      - generic [ref=e62]:
        - generic [ref=e63]: Login Obrigatório
        - generic [ref=e64]:
          - generic [ref=e66]: Nunca 🟢
          - generic [ref=e68]: Sempre 🔴
      - generic [ref=e69]:
        - generic [ref=e70]: Custo
        - generic [ref=e71]:
          - generic [ref=e73]: Grátis e Código Aberto 🟢
          - generic [ref=e75]: Freemium / Pago 🟡
      - generic [ref=e76]:
        - generic [ref=e77]: Criptografia
        - generic [ref=e78]:
          - generic [ref=e80]: Ponta-a-Ponta (Direto) 🟢
          - generic [ref=e82]: Descriptografado no Servidor 🟡
      - generic [ref=e83]:
        - generic [ref=e84]: Rastreamento / Anúncios
        - generic [ref=e85]:
          - generic [ref=e87]: Absolutamente Zero 🟢
          - generic [ref=e89]: Extensivo 🔴
      - generic [ref=e90]:
        - generic [ref=e91]: Logs de Atividade
        - generic [ref=e92]:
          - generic [ref=e94]: Nenhum (Efêmero) 🟢
          - generic [ref=e96]: Armazenados p/ Metadados 🔴
      - generic [ref=e97]:
        - generic [ref=e98]: Transparência
        - generic [ref=e99]:
          - generic [ref=e101]: Código Aberto (OSS) 🟢
          - generic [ref=e103]: Caixa-Preta (Fechado) 🔴
  - generic [ref=e104]:
    - heading "ninjalive" [level=2] [ref=e106]
    - generic [ref=e107]:
      - generic [ref=e108]:
        - generic:
          - generic: 
        - heading "Anonimato Total" [level=3] [ref=e109]
        - paragraph [ref=e110]: Sem necessidade de conta. Basta escolher um nome e entrar. Sua identidade permanece sua.
      - generic [ref=e111]:
        - generic:
          - generic: 
        - heading "Mídia Sem Servidor" [level=3] [ref=e112]
        - paragraph [ref=e113]: Utilizamos tecnologia P2P Mesh. Vídeo e áudio vão diretamente entre você e seus pares. Nós não vemos nada.
      - generic [ref=e114]:
        - generic:
          - generic: 
        - heading "Criptografia Militar" [level=3] [ref=e115]
        - paragraph [ref=e116]: Protegido pela criptografia padrão WebRTC (DTLS/SRTP). Seguro por padrão.
  - generic [ref=e119]:
    - generic [ref=e120]:
      - heading "Software Livre & Aberto" [level=2] [ref=e121]
      - paragraph [ref=e122]: Construa o seu próprio sistema de reuniões.
      - paragraph [ref=e123]: O ninjalive é 100% open source. Você pode clonar o repositório, modificar e usar como quiser, inclusive em projetos comerciais.
      - paragraph [ref=e124]:
        - text: A única condição é manter o crédito
        - strong [ref=e125]: "'Powered by ninjalive'"
        - text: com o link para o nosso repositório original. Queremos incentivar a criação de sistemas de reuniões seguros e sem infraestrutura pesada!
      - link " Ver Repositório no GitHub" [ref=e126] [cursor=pointer]:
        - /url: https://github.com/suissa/purecore-ninjalive
        - generic [ref=e127]: 
        - generic [ref=e128]: Ver Repositório no GitHub
    - code [ref=e132]: git clone suissa/purecore-ninjalive cd purecore-ninjalive npm install npm run dev
  - generic [ref=e133]:
    - heading "Pronto para ficar invisível?" [level=2] [ref=e134]
    - paragraph [ref=e135]: Inicie uma reunião segura em segundos.
    - link "Abrir ninjalive" [ref=e136] [cursor=pointer]:
      - /url: https://ninjalive.clan.purecore.codes
  - contentinfo [ref=e137]:
    - img "Logo" [ref=e140]
    - generic [ref=e141]:
      - generic [ref=e142]:
        - link "Github" [ref=e143] [cursor=pointer]:
          - /url: "#"
          - generic [ref=e144]: 
        - link "Twitter" [ref=e145] [cursor=pointer]:
          - /url: "#"
          - generic [ref=e146]: 
        - link "Discord" [ref=e147] [cursor=pointer]:
          - /url: "#"
          - generic [ref=e148]: 
      - paragraph [ref=e149]: © 2026 ninjalive. Projeto de Código Aberto.
      - generic [ref=e150]: "\"Invisibility is a superpower.\""
```

# Test source

```ts
  112 |       const count = await items.count();
  113 | 
  114 |       for (let i = 0; i < count; i++) {
  115 |         const item = items.nth(i);
  116 |         await item.scrollIntoViewIfNeeded();
  117 | 
  118 |         // Each item should have a label
  119 |         const label = item.locator(".comp-list-label");
  120 |         await expect(label).toBeVisible();
  121 |         const labelText = await label.textContent();
  122 |         expect(labelText.trim().length).toBeGreaterThan(0);
  123 | 
  124 |         // Each item should have ninjalive value
  125 |         const ninja = item.locator(".comp-list-ninja");
  126 |         await expect(ninja).toBeVisible();
  127 | 
  128 |         // Each item should have others value
  129 |         const others = item.locator(".comp-list-others");
  130 |         await expect(others).toBeVisible();
  131 |       }
  132 |     });
  133 | 
  134 |     test("mobile list should be 90vw wide and centered", async ({ page }) => {
  135 |       const list = page.locator(".comparison-list-mobile");
  136 |       await list.scrollIntoViewIfNeeded();
  137 |       const box = await list.boundingBox();
  138 |       const expectedWidth = MOBILE_VIEWPORT.width * 0.9;
  139 | 
  140 |       expect(box.width).toBeGreaterThan(expectedWidth - 5);
  141 |       expect(box.width).toBeLessThan(expectedWidth + 5);
  142 | 
  143 |       const leftMargin = box.x;
  144 |       const rightMargin = MOBILE_VIEWPORT.width - (box.x + box.width);
  145 |       expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(5);
  146 |     });
  147 | 
  148 |     test("take screenshot of comparison list on mobile", async ({ page }) => {
  149 |       const list = page.locator(".comparison-list-mobile");
  150 |       await list.scrollIntoViewIfNeeded();
  151 |       await list.screenshot({
  152 |         path: "test-results/02-comparison-list-mobile.png",
  153 |       });
  154 |     });
  155 |   });
  156 | 
  157 |   // ============================================================
  158 |   // 3. OSS SECTION: GitHub icon + Code card padding
  159 |   // ============================================================
  160 |   test.describe("OSS Section - GitHub icon & Code card", () => {
  161 |     test("GitHub button should contain fa-github icon", async ({ page }) => {
  162 |       const githubBtn = page.locator("#oss .btn-secondary");
  163 |       await githubBtn.scrollIntoViewIfNeeded();
  164 |       await expect(githubBtn).toBeVisible();
  165 | 
  166 |       const icon = githubBtn.locator("i.fa-brands.fa-github");
  167 |       await expect(icon).toBeVisible();
  168 |     });
  169 | 
  170 |     test("GitHub icon should render as a proper icon (not broken text)", async ({
  171 |       page,
  172 |     }) => {
  173 |       const icon = page.locator("#oss .btn-secondary i.fa-github");
  174 |       await icon.scrollIntoViewIfNeeded();
  175 | 
  176 |       // Font Awesome icons use ::before pseudo-element with font-family
  177 |       // If the icon is broken, the computed font-family won't be "Font Awesome"
  178 |       const fontFamily = await icon.evaluate(
  179 |         (el) => window.getComputedStyle(el, "::before").fontFamily
  180 |       );
  181 |       // Font Awesome 6 brands font family
  182 |       expect(fontFamily.toLowerCase()).toContain("font awesome");
  183 |     });
  184 | 
  185 |     test("code-card should have reduced Y padding on mobile (<=1rem = 16px)", async ({
  186 |       page,
  187 |     }) => {
  188 |       const codeCard = page.locator("#oss .code-card");
  189 |       await codeCard.scrollIntoViewIfNeeded();
  190 | 
  191 |       const padding = await codeCard.evaluate((el) => {
  192 |         const cs = window.getComputedStyle(el);
  193 |         return {
  194 |           top: parseFloat(cs.paddingTop),
  195 |           bottom: parseFloat(cs.paddingBottom),
  196 |           left: parseFloat(cs.paddingLeft),
  197 |           right: parseFloat(cs.paddingRight),
  198 |         };
  199 |       });
  200 | 
  201 |       // Padding Y should be 1rem = 16px (not the default 2rem = 32px)
  202 |       expect(padding.top).toBeLessThanOrEqual(17);
  203 |       expect(padding.bottom).toBeLessThanOrEqual(17);
  204 |     });
  205 | 
  206 |     test("OSS visual container should be 90vw", async ({ page }) => {
  207 |       const ossVisual = page.locator("#oss .oss-visual");
  208 |       await ossVisual.scrollIntoViewIfNeeded();
  209 |       const box = await ossVisual.boundingBox();
  210 |       const expectedWidth = MOBILE_VIEWPORT.width * 0.9;
  211 | 
> 212 |       expect(box.width).toBeGreaterThan(expectedWidth - 5);
      |                         ^ Error: expect(received).toBeGreaterThan(expected)
  213 |       expect(box.width).toBeLessThan(expectedWidth + 5);
  214 |     });
  215 | 
  216 |     test("take screenshot of OSS section on mobile", async ({ page }) => {
  217 |       const section = page.locator("#oss");
  218 |       await section.scrollIntoViewIfNeeded();
  219 |       await section.screenshot({
  220 |         path: "test-results/03-oss-section-mobile.png",
  221 |       });
  222 |     });
  223 |   });
  224 | 
  225 |   // ============================================================
  226 |   // 5. FULL PAGE SCREENSHOT
  227 |   // ============================================================
  228 |   test("full page screenshot on mobile", async ({ page }) => {
  229 |     await page.screenshot({
  230 |       path: "test-results/04-full-page-mobile.png",
  231 |       fullPage: true,
  232 |     });
  233 |   });
  234 | 
  235 |   // ============================================================
  236 |   // 4. DESKTOP: Table should be visible, list hidden
  237 |   // ============================================================
  238 |   test.describe("Desktop - Table visible, list hidden", () => {
  239 |     test("on desktop, table should be visible and list hidden", async ({
  240 |       page,
  241 |     }) => {
  242 |       await page.setViewportSize({ width: 1280, height: 720 });
  243 |       await page.goto("/", { waitUntil: "networkidle" });
  244 |       await page.waitForTimeout(500);
  245 | 
  246 |       const tableWrapper = page.locator(".comparison-table-wrapper");
  247 |       await expect(tableWrapper).toBeVisible();
  248 | 
  249 |       const mobileList = page.locator(".comparison-list-mobile");
  250 |       await expect(mobileList).toBeHidden();
  251 |     });
  252 |   });
  253 | });
  254 | 
```