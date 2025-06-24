'use client';
// TODO: Update the import path below to the correct location of formWizardContext
// import { useFormWizard } from '../formWizardContext';
// import { useFormWizard } from '../formWizardContext'; // <-- Update this path if needed
// import { useFormWizard } from 'src/app/formWizardContext';
import { useFormWizard } from '../../FormWizardContext';

export default function ResultsPage() {
  const { data } = useFormWizard();
  // ...call backend and render results using collected data...
  return <div>Results: {JSON.stringify(data)}</div>;
}
