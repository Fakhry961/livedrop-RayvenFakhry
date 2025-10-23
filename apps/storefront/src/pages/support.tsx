import SupportAssistant from "../components/organisms/SupportAssistant";

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-semibold">Support</h1>
      <p className="text-gray-600">Ask about policies, orders, or products.</p>
      <SupportAssistant />
    </div>
  );
}
