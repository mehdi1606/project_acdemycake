const fs = require('fs');
const path = 'c:/Users/asus/Documents/Project main/plateforme/template/src/feature-module/router/router.link.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('RoleGuard')) {
    content = content.replace('import SubscriptionGuard from "../common/SubscriptionGuard";', 'import SubscriptionGuard from "../common/SubscriptionGuard";\nimport RoleGuard from "../common/RoleGuard";');
}

// Helper to replace elements with RoleGuard
const wrapWithRoleGuard = (elementRegex, rolesStr) => {
    content = content.replace(new RegExp(`element:\\s*<(${elementRegex})\\s*/>\\s*,`, 'g'), `element: <RoleGuard allowedRoles={[${rolesStr}]}><$1 /></RoleGuard>,`);
};

// Admin replacements
wrapWithRoleGuard('Admin[^>]*', "'ADMIN'");
// Instructor replacements
wrapWithRoleGuard('[^>]*Instructor[^>]*', "'INSTRUCTOR', 'ADMIN'");
wrapWithRoleGuard('CourseManage', "'INSTRUCTOR', 'ADMIN'");
wrapWithRoleGuard('StudentsDetails', "'INSTRUCTOR', 'ADMIN'");
wrapWithRoleGuard('StudentGrid', "'INSTRUCTOR', 'ADMIN'");
wrapWithRoleGuard('StudentList', "'INSTRUCTOR', 'ADMIN'");

// Catch-all 404
if (!content.includes("path: '*',")) {
    content = content.replace('];\n\nexport const authRoutes', '  {\n    path: "*",\n    element: <Error404 />,\n    route: Route,\n  },\n];\n\nexport const authRoutes');
}

fs.writeFileSync(path, content);
console.log('Update completed successfully');
