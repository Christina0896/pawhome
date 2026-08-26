import { permanentRedirect } from 'next/navigation';

export default function SafetyRedirectPage() {
  permanentRedirect('/buying-safely');
}
