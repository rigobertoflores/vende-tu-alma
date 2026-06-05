import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  menuOpen = false;

  offers = [
    { tier: 'tentador', pts: 10,  icon: '◈', title: 'Plática íntima',    desc: '2 minutos de conversación sin filtros' },
    { tier: 'tentador', pts: 25,  icon: '◈', title: 'Baile compartido',   desc: 'Una pieza en la pista, cuerpo a cuerpo' },
    { tier: 'atrevido', pts: 40,  icon: '◆', title: 'Toque prohibido',    desc: 'Una caricia en el lugar que elijas' },
    { tier: 'atrevido', pts: 60,  icon: '◆', title: 'Secreto al oído',    desc: 'Lo que nadie más puede escuchar' },
    { tier: 'sin-limite', pts: 150, icon: '♦', title: 'Experiencia única', desc: 'Solo los más audaces se atreven a pedir' },
    { tier: 'sin-limite', pts: 300, icon: '♦', title: 'Alma completa',     desc: 'Sin restricciones. Sin límites.' },
  ];

  steps = [
    { num: 'I',   title: 'Crea tu alma',      desc: 'Elige tu apodo de la noche y sube lo que estás dispuesto a vender. El administrador asigna tu valor.' },
    { num: 'II',  title: 'Entra al juego',     desc: 'Escanea el QR en la puerta. Tu perfil se activa. El catálogo te espera.' },
    { num: 'III', title: 'Negocia en persona', desc: 'Encuentra a quien te interesa, busca su nombre en la app. Lo que pasa después… es entre ustedes.' },
    { num: 'IV',  title: 'Cierra el trato',    desc: 'Confirman el acuerdo en la app. Los créditos se mueven. La noche avanza.' },
    { num: 'V',   title: 'Gana la noche',      desc: 'Quien más vende, gana. El marcador en tiempo real lo dice todo.' },
  ];

  rules = [
    'Solo parejas registradas y unicornios con acceso validado',
    'No puedes comprarle a tu propia pareja — explora más allá',
    'La negociación ocurre cara a cara, no en la app',
    'Todo intercambio requiere acuerdo mutuo explícito',
    'Los créditos no tienen valor monetario fuera del evento',
    'El administrador puede ajustar ponderaciones en tiempo real',
  ];

  toggleMenu() { this.menuOpen = !this.menuOpen; }

  scrollTo(id: string) {
    this.menuOpen = false;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
