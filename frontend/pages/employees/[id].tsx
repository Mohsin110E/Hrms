import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  getEmployee,
  getEmployees,
  createEmployee,
  updateEmployee,
  getDepartments,
  getSites,
  getShifts,
  getLanguages,
  getParameters,
  getEmployeeDependants,
  createEmployeeDependant,
  updateEmployeeDependant,
  deleteEmployeeDependant,
  getDocuments,
  createDocument,
  attachDocumentFile,
  downloadDocumentFile,
  getDocumentTypes,
  Dependant,
  Document,
} from '../../lib/api';

type TabKey = 'personal' | 'work' | 'documents' | 'dependents';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'work', label: 'Work Info' },
  { key: 'documents', label: 'Documents' },
  { key: 'dependents', label: 'Dependents' },
];

export default function EmployeeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, isLoading } = useAuth();

  const isNew = id === 'new';
  const employeeId = typeof id === 'string' && !isNew ? parseInt(id, 10) : undefined;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<CreateEmployeePayload & UpdateEmployeePayload>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNo: '',
    dateOfBirth: '',
    maritalStatusId: undefined,
    genderId: undefined,
    bloodGroupId: undefined,
    nationalityId: undefined,
    visaTypeId: undefined,
    motherTongueId: undefined,
    address: '',
    homeCountryAddress: '',
    homeCountryPhoneNo: '',
    qualification: '',
    dateOfExit: '',
    exitReasonCode: undefined,
    employeeCode: '',
    reportingToId: undefined,
    sourceOfHireId: undefined,
    locationId: undefined,
    siteId: undefined,
    employeeStatusId: undefined,
    employeeTypeId: undefined,
    contractTypeId: undefined,
    workPhone: '',
    extension: '',
    workEmail: '',
    dateOfJoining: '',
    dateOfConfirmation: '',
    personIdNumber: '',
    designation: '',
    shiftId: undefined,
    departmentIds: [],
    isSiteAccess: false,
  });

  // Lookups
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [sites, setSites] = useState<{ id: number; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: number; name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<{ id: number; text: string }[]>([]);
  const [genders, setGenders] = useState<{ id: number; text: string }[]>([]);
  const [bloodGroups, setBloodGroups] = useState<{ id: number; text: string }[]>([]);
  const [sourceOfHires, setSourceOfHires] = useState<{ id: number; text: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; text: string }[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<{ id: number; text: string }[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<{ id: number; text: string }[]>([]);
  const [contractTypes, setContractTypes] = useState<{ id: number; text: string }[]>([]);
  const [exitReasons, setExitReasons] = useState<{ id: number; text: string }[]>([]);
  const [nationalities, setNationalities] = useState<{ id: number; text: string }[]>([]);
  const [visaTypes, setVisaTypes] = useState<{ id: number; text: string }[]>([]);
  const [reportingTos, setReportingTos] = useState<{ id: number; employeeCode: string; profile: { name: string; lastName?: string } }[]>([]);
  const [relationTypes, setRelationTypes] = useState<{ id: number; text: string }[]>([]);
  const [documentTypes, setDocumentTypes] = useState<{ id: number; name: string }[]>([]);

  // Documents & dependants
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [newDependant, setNewDependant] = useState({ firstName: '', lastName: '', relationTypeId: '', dateOfBirth: '' });
  const [newDoc, setNewDoc] = useState({ documentTypeId: '', documentTitle: '', identityNo: '', issueDate: '', expiryDate: '', remarks: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !router.isReady) return;
    loadLookups();
    if (isNew) {
      setLoading(false);
      return;
    }
    if (employeeId) loadEmployee(employeeId);
  }, [isAuthenticated, router.isReady, id]);

  const loadLookups = async () => {
    try {
      const [
        d,
        s,
        sh,
        l,
        ms,
        g,
        bg,
        nat,
        vt,
        soh,
        loc,
        et,
        es,
        ct,
        er,
        emps,
        rt,
        dt,
      ] = await Promise.all([
        getDepartments({ isActive: true }),
        getSites(),
        getShifts(),
        getLanguages(),
        getParameters('Marital Status'),
        getParameters('Gender'),
        getParameters('BloodGroup'),
        getParameters('Nationality'),
        getParameters('Visa Type'),
        getParameters('Source of hire'),
        getParameters('Location'),
        getParameters('Employee Type'),
        getParameters('Employee Status'),
        getParameters('Contract Type'),
        getParameters('ExitReason'),
        getEmployees({ isActive: true, pageSize: 100 }),
        getParameters('Dependant Relation'),
        getDocumentTypes(),
      ]);
      setDepartments(d.data);
      setSites(s.data);
      setShifts(sh.data);
      setLanguages(l.data);
      setMaritalStatuses(ms.data);
      setGenders(g.data);
      setBloodGroups(bg.data);
      setNationalities(nat.data);
      setVisaTypes(vt.data);
      setSourceOfHires(soh.data);
      setLocations(loc.data);
      setEmployeeTypes(et.data);
      setEmployeeStatuses(es.data);
      setContractTypes(ct.data);
      setExitReasons(er.data);
      setReportingTos(emps.data);
      setRelationTypes(rt.data);
      setDocumentTypes(dt.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load lookups');
    }
  };

  const loadEmployee = async (eid: number) => {
    setLoading(true);
    try {
      const res = await getEmployee(eid);
      const emp = res.data;
      setEmployee(emp);
      setForm({
        firstName: emp.profile?.name || '',
        middleName: emp.profile?.middleName || '',
        lastName: emp.profile?.lastName || '',
        email: emp.profile?.email || '',
        contactNo: emp.profile?.contactNo || '',
        dateOfBirth: formatDateInput(emp.profile?.dateOfBirth),
        maritalStatusId: emp.profile?.maritalStatusId,
        genderId: emp.profile?.genderId,
        bloodGroupId: emp.profile?.bloodGroupId,
        nationalityId: emp.profile?.nationalityId,
        visaTypeId: emp.profile?.visaTypeId,
        motherTongueId: emp.profile?.motherTongueId,
        address: emp.profile?.address || '',
        homeCountryAddress: emp.profile?.homeCountryAddress || '',
        homeCountryPhoneNo: emp.profile?.homeCountryPhoneNo || '',
        qualification: emp.profile?.qualification || '',
        dateOfExit: formatDateInput(emp.profile?.dateOfExit),
        exitReasonCode: emp.profile?.exitReasonCode,
        employeeCode: emp.employeeCode || '',
        reportingToId: emp.reportingToId,
        sourceOfHireId: emp.sourceOfHireId,
        locationId: emp.locationId,
        siteId: emp.siteId,
        employeeStatusId: emp.employeeStatusId,
        employeeTypeId: emp.employeeTypeId,
        contractTypeId: emp.contractTypeId,
        workPhone: emp.workPhone || '',
        extension: emp.extension || '',
        workEmail: emp.workEmail || '',
        dateOfJoining: formatDateInput(emp.dateOfJoining),
        dateOfConfirmation: formatDateInput(emp.dateOfConfirmation),
        personIdNumber: emp.personIdNumber || '',
        designation: emp.designation || '',
        shiftId: emp.shiftId,
        departmentIds: emp.profile?.departments?.map((d) => d.departmentId) || [],
        isSiteAccess: emp.profile?.isSiteAccess || false,
      });
      await loadDocuments(emp.profileId);
      await loadDependants(eid);
    } catch (err: any) {
      setError(err.message || 'Failed to load employee');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (profileId: number) => {
    try {
      const res = await getDocuments({ profileId, pageSize: 100 });
      setDocuments(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    }
  };

  const loadDependants = async (eid: number) => {
    try {
      const res = await getEmployeeDependants(eid);
      setDependants(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dependants');
    }
  };

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDepartment = (deptId: number) => {
    setForm((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds?.includes(deptId)
        ? prev.departmentIds.filter((d) => d !== deptId)
        : [...(prev.departmentIds || []), deptId],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = sanitizePayload(form);
      if (isNew) {
        const created = await createEmployee(payload as CreateEmployeePayload);
        router.replace(`/employees/${created.data.id}`);
      } else if (employeeId) {
        await updateEmployee(employeeId, payload);
        setError('');
        if (employeeId) await loadEmployee(employeeId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDependant = async () => {
    if (!employeeId) return;
    try {
      await createEmployeeDependant(employeeId, {
        firstName: newDependant.firstName,
        lastName: newDependant.lastName,
        relationTypeId: newDependant.relationTypeId ? parseInt(newDependant.relationTypeId, 10) : undefined,
        dateOfBirth: newDependant.dateOfBirth || undefined,
      });
      setNewDependant({ firstName: '', lastName: '', relationTypeId: '', dateOfBirth: '' });
      await loadDependants(employeeId);
    } catch (err: any) {
      setError(err.message || 'Failed to add dependant');
    }
  };

  const handleDeleteDependant = async (dependantId: number) => {
    if (!employeeId || !confirm('Delete this dependant?')) return;
    try {
      await deleteEmployeeDependant(employeeId, dependantId);
      await loadDependants(employeeId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete dependant');
    }
  };

  const handleAddDocument = async () => {
    if (!employee) return;
    try {
      const created = await createDocument({
        profileId: employee.profileId,
        documentTypeId: parseInt(newDoc.documentTypeId, 10),
        documentTitle: newDoc.documentTitle || undefined,
        identityNo: newDoc.identityNo || undefined,
        issueDate: newDoc.issueDate || undefined,
        expiryDate: newDoc.expiryDate || undefined,
        remarks: newDoc.remarks || undefined,
        isSelf: false,
      });
      if (selectedFile) {
        await attachDocumentFile(created.data.id, selectedFile);
      }
      setNewDoc({ documentTypeId: '', documentTitle: '', identityNo: '', issueDate: '', expiryDate: '', remarks: '' });
      setSelectedFile(null);
      await loadDocuments(employee.profileId);
    } catch (err: any) {
      setError(err.message || 'Failed to add document');
    }
  };

  const handleViewFile = async (docId: number, fileId: number, fileName: string) => {
    try {
      const url = await downloadDocumentFile(docId, fileId);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download file');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isNew ? 'Add Employee' : 'Edit Employee'}</h2>
          <p className="text-gray-500 mt-1">{isNew ? 'Create a new employee record.' : `Employee #${employee?.employeeCode}`}</p>
        </div>
        <Link href="/employees">
          <a className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Back to list</a>
        </Link>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max">
            {tabs.map((tab) => {
              const disabled = isNew && (tab.key === 'documents' || tab.key === 'dependents');
              return (
                <button
                  key={tab.key}
                  disabled={disabled}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {tab.label}
                  {disabled && ' (save first)'}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Input label="First Name *" value={form.firstName} onChange={(v) => handleChange('firstName', v)} required />
                <Input label="Middle Name" value={form.middleName || ''} onChange={(v) => handleChange('middleName', v)} />
                <Input label="Last Name" value={form.lastName || ''} onChange={(v) => handleChange('lastName', v)} />
                <Input type="email" label="Personal Email" value={form.email || ''} onChange={(v) => handleChange('email', v)} />
                <Input label="Contact No" value={form.contactNo || ''} onChange={(v) => handleChange('contactNo', v)} />
                <Input type="date" label="Date of Birth" value={form.dateOfBirth || ''} onChange={(v) => handleChange('dateOfBirth', v)} />
                <Select label="Marital Status" value={form.maritalStatusId || ''} options={maritalStatuses.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('maritalStatusId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Gender" value={form.genderId || ''} options={genders.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('genderId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Blood Group" value={form.bloodGroupId || ''} options={bloodGroups.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('bloodGroupId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Nationality" value={form.nationalityId || ''} options={nationalities.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('nationalityId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Visa Type" value={form.visaTypeId || ''} options={visaTypes.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('visaTypeId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Mother Tongue" value={form.motherTongueId || ''} options={languages.map((l) => ({ value: l.id, label: l.name }))} onChange={(v) => handleChange('motherTongueId', v ? parseInt(v, 10) : undefined)} />
                <Input label="Qualification" value={form.qualification || ''} onChange={(v) => handleChange('qualification', v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Country Address</label>
                  <textarea value={form.homeCountryAddress || ''} onChange={(e) => handleChange('homeCountryAddress', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
                </div>
              </div>
              <div>
                <Input label="Home Country Phone No" value={form.homeCountryPhoneNo || ''} onChange={(v) => handleChange('homeCountryPhoneNo', v)} />
              </div>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Work Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Input label="Employee Code *" value={form.employeeCode} onChange={(v) => handleChange('employeeCode', v)} required />
                <Input label="Designation" value={form.designation || ''} onChange={(v) => handleChange('designation', v)} />
                <Input type="date" label="Date of Joining *" value={form.dateOfJoining} onChange={(v) => handleChange('dateOfJoining', v)} required />
                <Input type="date" label="Date of Confirmation" value={form.dateOfConfirmation || ''} onChange={(v) => handleChange('dateOfConfirmation', v)} />
                <Input label="Work Email" type="email" value={form.workEmail || ''} onChange={(v) => handleChange('workEmail', v)} />
                <Input label="Work Phone" value={form.workPhone || ''} onChange={(v) => handleChange('workPhone', v)} />
                <Input label="Extension" value={form.extension || ''} onChange={(v) => handleChange('extension', v)} />
                <Input label="Person ID Number" value={form.personIdNumber || ''} onChange={(v) => handleChange('personIdNumber', v)} />
                <Select label="Site" value={form.siteId || ''} options={sites.map((s) => ({ value: s.id, label: s.name }))} onChange={(v) => handleChange('siteId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Shift" value={form.shiftId || ''} options={shifts.map((s) => ({ value: s.id, label: s.name }))} onChange={(v) => handleChange('shiftId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Employee Type" value={form.employeeTypeId || ''} options={employeeTypes.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('employeeTypeId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Source of Hire" value={form.sourceOfHireId || ''} options={sourceOfHires.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('sourceOfHireId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Location" value={form.locationId || ''} options={locations.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('locationId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Reporting To" value={form.reportingToId || ''} options={reportingTos.map((e) => ({ value: e.id, label: `${e.employeeCode} - ${e.profile?.name} ${e.profile?.lastName || ''}`.trim() }))} onChange={(v) => handleChange('reportingToId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Employee Status" value={form.employeeStatusId || ''} options={employeeStatuses.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('employeeStatusId', v ? parseInt(v, 10) : undefined)} />
                <Select label="Contract Type" value={form.contractTypeId || ''} options={contractTypes.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('contractTypeId', v ? parseInt(v, 10) : undefined)} />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Exit Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Input type="date" label="Date of Exit" value={form.dateOfExit || ''} onChange={(v) => handleChange('dateOfExit', v)} />
                  <Select label="Exit Reason" value={form.exitReasonCode || ''} options={exitReasons.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => handleChange('exitReasonCode', v ? parseInt(v, 10) : undefined)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
                <div className="flex flex-wrap gap-2">
                  {departments.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDepartment(d.id)}
                      className={`px-3 py-1 text-xs rounded-full border transition ${
                        form.departmentIds?.includes(d.id)
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isSiteAccess} onChange={(e) => handleChange('isSiteAccess', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Grant site access (can log in)
              </label>
            </div>
          )}

          {activeTab === 'documents' && employee && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select label="Document Type *" value={newDoc.documentTypeId} options={documentTypes.map((d) => ({ value: d.id, label: d.name }))} onChange={(v) => setNewDoc({ ...newDoc, documentTypeId: v })} />
                  <Input label="Document Title" value={newDoc.documentTitle} onChange={(v) => setNewDoc({ ...newDoc, documentTitle: v })} />
                  <Input label="Identity / Doc No" value={newDoc.identityNo} onChange={(v) => setNewDoc({ ...newDoc, identityNo: v })} />
                  <Input type="date" label="Issue Date" value={newDoc.issueDate} onChange={(v) => setNewDoc({ ...newDoc, issueDate: v })} />
                  <Input type="date" label="Expiry Date" value={newDoc.expiryDate} onChange={(v) => setNewDoc({ ...newDoc, expiryDate: v })} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                    <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <Input label="Remarks" value={newDoc.remarks} onChange={(v) => setNewDoc({ ...newDoc, remarks: v })} />
                </div>
                <button onClick={handleAddDocument} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">Add Document</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">Title</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Identity No</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Expiry</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Files</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No documents found.</td></tr>
                    ) : (
                      documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{doc.documentTitle || doc.documentType?.name}</td>
                          <td className="px-4 py-3 text-gray-600">{doc.documentType?.name}</td>
                          <td className="px-4 py-3 text-gray-600">{doc.identityNo || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {doc.files?.map((f, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleViewFile(doc.id, f.file.id, f.file.originalName)}
                                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
                                >
                                  {f.file.originalName}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'dependents' && employee && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Dependents</h3>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Input label="First Name *" value={newDependant.firstName} onChange={(v) => setNewDependant({ ...newDependant, firstName: v })} />
                  <Input label="Last Name" value={newDependant.lastName} onChange={(v) => setNewDependant({ ...newDependant, lastName: v })} />
                  <Select label="Relation" value={newDependant.relationTypeId} options={relationTypes.map((p) => ({ value: p.id, label: p.text }))} onChange={(v) => setNewDependant({ ...newDependant, relationTypeId: v })} />
                  <Input type="date" label="Date of Birth" value={newDependant.dateOfBirth} onChange={(v) => setNewDependant({ ...newDependant, dateOfBirth: v })} />
                </div>
                <button onClick={handleAddDependant} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">Add Dependent</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Relation</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Date of Birth</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dependants.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No dependents found.</td></tr>
                    ) : (
                      dependants.map((dep) => (
                        <tr key={dep.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{dep.dependantProfile?.name} {dep.dependantProfile?.lastName}</td>
                          <td className="px-4 py-3 text-gray-600">{relationTypes.find((r) => r.id === dep.relationTypeId)?.text || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{dep.dependantProfile?.dateOfBirth ? new Date(dep.dependantProfile.dateOfBirth).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDeleteDependant(dep.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/employees">
          <a className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</a>
        </Link>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-60">
          {saving ? 'Saving...' : isNew ? 'Create Employee' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function sanitizePayload(form: CreateEmployeePayload & UpdateEmployeePayload): CreateEmployeePayload | UpdateEmployeePayload {
  const payload = { ...form };
  // Remove empty optional strings so backend doesn't receive ""
  (Object.keys(payload) as Array<keyof typeof payload>).forEach((k) => {
    const val = payload[k];
    if (typeof val === 'string' && val.trim() === '') {
      (payload as any)[k] = undefined;
    }
  });
  return payload;
}

function formatDateInput(value?: string | Date | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
