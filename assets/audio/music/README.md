# Música de fundo do jogo

O jogo toca uma única trilha em loop contínuo durante todo o jogo (menu, todas as fases, telas de vitória/derrota):

- `game_sound.mp3`

O `guardioes_fase1.html` inicia essa faixa (`MUSIC.start()`) assim que o jogador interage pela primeira vez (tecla ou clique) — isso é necessário porque os navegadores bloqueiam áudio automático sem interação do usuário. A partir daí ela toca ininterruptamente, sem parar ou trocar entre fases.

Para trocar a música, basta substituir o arquivo `game_sound.mp3` mantendo o mesmo nome.
