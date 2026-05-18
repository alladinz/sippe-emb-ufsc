# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Sistema de Gestão de Planos de Ensino
      - generic [ref=e6]: Entre com suas credenciais para acessar o sistema
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: E-mail
          - textbox "E-mail" [ref=e11]:
            - /placeholder: professor@teste.com
        - generic [ref=e12]:
          - generic [ref=e13]: Senha
          - textbox "Senha" [ref=e14]
      - button "Entrar" [ref=e16] [cursor=pointer]
  - status [ref=e17]:
    - generic [ref=e18]:
      - img [ref=e20]
      - generic [ref=e22]:
        - text: Static route
        - button "Hide static indicator" [ref=e23] [cursor=pointer]:
          - img [ref=e24]
  - alert [ref=e27]
```