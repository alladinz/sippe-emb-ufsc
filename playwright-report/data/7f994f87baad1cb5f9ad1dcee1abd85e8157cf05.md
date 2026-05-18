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
            - text: errado@teste.com
        - generic [ref=e12]:
          - generic [ref=e13]: Senha
          - textbox "Senha" [ref=e14]: errada
      - generic [ref=e15]:
        - button "Entrando..." [disabled]
  - status [ref=e16]:
    - generic [ref=e17]:
      - img [ref=e19]
      - generic [ref=e21]:
        - text: Static route
        - button "Hide static indicator" [ref=e22] [cursor=pointer]:
          - img [ref=e23]
  - alert [ref=e26]
```