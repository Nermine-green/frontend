'use client';
import { useRouter } from 'next/navigation';
import { useFormWizard } from '../../FormWizardContext';

// Example testTypeOptions definition; replace with your actual options or import if defined elsewhere
const testTypeOptions = [
  { value: 'type1', label: 'Type 1' },
  { value: 'type2', label: 'Type 2' },
];

export default function TestTypePage() {
  const router = useRouter();
  const { data, setData } = useFormWizard();

  return (
    <div>
      <h2>Select Test Type</h2>
      {testTypeOptions.map(option => (
        <button
          key={option.value}
          onClick={() => {
            setData({ ...data, testType: option.value });
            router.push('/wizard/standard');
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
