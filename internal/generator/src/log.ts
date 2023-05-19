import kleur from 'kleur';

const baseLog =
  (color: kleur.Color) =>
  (...args: any) =>
    console.info(color(args));

export const log = {
  accent: baseLog(kleur.italic().cyan),
  branded: (...args: any) => baseLog(kleur.underline().green)(`===ᚱ ${args} ᚱ===`),
  error: baseLog(kleur.bold().red),
  info: baseLog(kleur.italic().dim),
};

export const messages = {
  logo: `
                            ...::...
                    .:=+*#%@@@@@@@@@@%#*+-:.
                .-+#@@@@@@@@@@@@@@@@@@@@@@@@#+-.
              .-#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#=.
          .:*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#+:-:
        .:*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#+-:: .#@@*:
      ..+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%+=::=*%+.=@@@@@@+
      .:%@@@@@@@@@@@@@@@@@@@@@@@@@%*=:.-+#@@@#::%@@@@@@@@%:
    .=@@@@@@@@@@@@@@@@@@@@@@%#+-.-=#%@@@%@@-.*@@@@@@@@@@@@-
    .=@@@@@@@@@@@@@@@@@@%#+-.-=*%@@%%@%%@@*.=@@@@@@@@@@@@@@@-
  .-@@@@@@@@@@@@@@@@@@@#:.#@@@@@@%@%%%@#::#@@@@@@@@@@@@@@@@@:
  .:%@@@@@@@@@@@@@@@@@@@@@*:-%@@@@@@%%@= +@@@@@@@@@@@@@@@@@@@%.
  .+@@@@@@@@@@@@@@@@@@@@@@@@*:-%@@@@@#.-@@@@@@@@@@@@@@@@@@@@@@+
.:%@@@@@@@@@@@@@@@@@@@@@@@@@@*:-%@%-:#@@@@@@@@@@@@@@@@@@@@@@@@%.
.-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*:-.+@@@@@@@@@@@@@@@@@@@@@@@@@@@:
.=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
.=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%-:.=@@@@@@@@@@@@@@@@@@@@@@@@@@@-
.-@@@@@@@@@@@@@@@@@@@@@@@@@@@%=.*@@=.=@@@@@@@@@@@@@@@@@@@@@@@@@:
.:%@@@@@@@@@@@@@@@@@@@@@@@@@=.+@@%@@@=.+@@@@@@@@@@@@@@@@@@@@@@%.
  :+@@@@@@@@@@@@@@@@@@@@@@@+.=@@@@@@@@@@=.+@@@@@@@@@@@@@@@@@@@+
  .:%@@@@@@@@@@@@@@@@@@@@*:=%@@@@@@@@@@@@@=.+@@@@@@@@@@@@@@@@%.
  :=@@@@@@@@@@@@@@@@@@#:-%@@@@@@@@@@@#+-:-+#@@@@@@@@@@@@@@@@-.
    :+@@@@@@@@@@@@@@@%-:#@@@@@@@@%*=:-=*%@@@@@@@@@@@@@@@@@@@=.
    :=@@@@@@@@@@@@%=:#@@@@@%*=-:=*%@@@@@@@@@@@@@@@@@@@@@@@=.
      :-%@@@@@@@@@=.*@@@#+-:=*#@@@@@@@@@@@@@@@@@@@@@@@@@@%:.
      .:*@@@@@@*:+%*=:-+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*..
        :-#@@*::--+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#:.
          .:--=#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*:.
            .-+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#=:.
              ..:=*%@@@@@@@@@@@@@@@@@@@@@@@@%*=:.
                  ..:-+*#%@@@@@@@@@@@@%#*=-:..
                        ....::------::....
`,
};
