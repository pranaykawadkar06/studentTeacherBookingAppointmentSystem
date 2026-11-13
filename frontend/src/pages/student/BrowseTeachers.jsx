import PageHeader from '../../components/PageHeader.jsx';
import TeacherBrowser from '../../components/TeacherBrowser.jsx';

export default function BrowseTeachers() {
  return (
    <div>
      <PageHeader title="Find a teacher" subtitle="Search by name, department or subject, then open a profile to see open slots." />
      <TeacherBrowser basePath="/student/teachers" />
    </div>
  );
}
