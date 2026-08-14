#!/usr/bin/env python3
"""
inject_tabs.py — remplace les 3 blocs JSX dans admin-console-page.tsx
par les appels de composants.
"""
src = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(src).readlines()

# We'll build replacements from bottom to top to preserve line numbers
# Section boundaries (1-indexed, inclusive)
replacements = [
    # (start, end, replacement_lines)
    (2839, 3190, [
        '      {activeTab === "users" && (\n',
        '        <UsersTab\n',
        '          adminUsers={adminUsers}\n',
        '          adminWhoami={adminWhoami}\n',
        '          createUser={createAdminUser}\n',
        '          inviteUser={inviteAdminUser}\n',
        '          resetPassword={resetAdminPassword}\n',
        '          deleteUser={deleteAdminUser}\n',
        '          adminAuditLog={adminAuditLog}\n',
        '        />\n',
        '      )}\n',
    ]),
    (1835, 2838, [
        '      {activeTab === "change-requests" && (\n',
        '        <ChangeRequestsTab\n',
        '          changeRequests={changeRequests}\n',
        '          createChangeRequest={createChangeRequest}\n',
        '          deleteChangeRequest={deleteChangeRequest}\n',
        '          transitionChangeRequest={transitionChangeRequest}\n',
        '          startImplementation={startImplementationChangeRequest}\n',
        '          kanbanColumns={kanbanColumns}\n',
        '          workflowRunMonitoring={workflowRunMonitoring}\n',
        '          crForm={crForm}\n',
        '          setCrForm={setCrForm}\n',
        '          crGuideInput={crGuideInput}\n',
        '          setCrGuideInput={setCrGuideInput}\n',
        '          crGuideLoading={crGuideLoading}\n',
        '          crGuideError={crGuideError}\n',
        '          handleCrGuide={handleCrGuide}\n',
        '          WORKFLOW_STATUS_COLUMNS={WORKFLOW_STATUS_COLUMNS}\n',
        '          STATUS_LABEL={STATUS_LABEL}\n',
        '        />\n',
        '      )}\n',
    ]),
    (1681, 1834, [
        '      {activeTab === "deliverability-ops" && (\n',
        '        <DeliverabilityOpsTab\n',
        '          procedureSaving={procedureSaving}\n',
        '          deliverabilityProcedure={deliverabilityProcedure}\n',
        '          deliverability={deliverability}\n',
        '          saveProcedureUpdate={saveProcedureUpdate}\n',
        '        />\n',
        '      )}\n',
    ]),
]

# Apply replacements from bottom to top
for start, end, repl in replacements:
    lines = lines[:start - 1] + repl + lines[end:]

open(src, "w").writelines(lines)
print(f"Done. admin-console-page.tsx: {len(lines)} lines (was 3192)")
