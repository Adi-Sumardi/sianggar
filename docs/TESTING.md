# SIANGGAR-NEXT Testing Documentation

## Overview

This document provides comprehensive documentation for the testing suite of SIANGGAR-NEXT (Sistem Informasi Pengajuan Anggaran). The application uses **Pest PHP** for backend testing.

## Test Structure

```
tests/
├── Unit/
│   ├── Enums/                     # Enum unit tests
│   │   ├── AmountCategoryTest.php
│   │   ├── ApprovalStageTest.php
│   │   ├── ApprovalStatusTest.php
│   │   ├── EmailStatusTest.php
│   │   ├── LpjApprovalStageTest.php
│   │   ├── LpjStatusTest.php
│   │   ├── ProposalStatusTest.php
│   │   ├── RapbsApprovalStageTest.php
│   │   ├── RapbsStatusTest.php
│   │   ├── ReferenceTypeTest.php
│   │   └── UserRoleTest.php
│   ├── Models/                    # Model unit tests
│   │   ├── ApbsTest.php
│   │   ├── ApprovalTest.php
│   │   ├── DiscussionTest.php
│   │   ├── EmailTest.php
│   │   ├── LpjTest.php
│   │   ├── MataAnggaranTest.php
│   │   ├── PengajuanAnggaranTest.php
│   │   ├── PktTest.php
│   │   ├── RapbsTest.php
│   │   └── UserTest.php
│   └── Services/                  # Service unit tests
│       ├── ApprovalServiceTest.php
│       ├── LpjApprovalServiceTest.php
│       └── PktServiceTest.php
├── Feature/
│   ├── Api/                       # API endpoint tests
│   │   ├── ApbsTest.php
│   │   ├── AuthTest.php
│   │   ├── DashboardTest.php
│   │   ├── EmailTest.php
│   │   ├── LpjTest.php
│   │   ├── NotificationTest.php
│   │   ├── PengajuanTest.php
│   │   ├── PktTest.php
│   │   ├── RapbsTest.php
│   │   └── UserManagementTest.php
│   └── Workflow/                  # Complete workflow tests
│       ├── LpjWorkflowTest.php
│       └── PengajuanWorkflowTest.php
└── TestCase.php
```

## Running Tests

```bash
# Run all tests
composer test

# Run specific test suite
php artisan test --testsuite=Unit
php artisan test --testsuite=Feature

# Run specific test file
php artisan test tests/Unit/Services/ApprovalServiceTest.php

# Run with coverage
php artisan test --coverage

# Run tests with filter
php artisan test --filter="ApprovalService"
```

## Test Categories

### 1. Unit Tests - Enums

Tests for all application enums ensuring correct values, labels, and helper methods.

| Enum | Test Coverage |
|------|---------------|
| `ProposalStatus` | Values, labels, colors |
| `ApprovalStage` | Values, labels, required roles, status after approval, amount edit permissions |
| `ApprovalStatus` | Values, labels, colors |
| `AmountCategory` | Values, labels, threshold, fromAmount logic |
| `ReferenceType` | Values, labels, approval stage mapping |
| `UserRole` | isUnit, isSubstansi, isApprover, canCreateProposal, canCreateLpj, dashboardType |
| `LpjStatus` | Values, labels, colors, isEditable, isFinal, isInWorkflow |
| `LpjApprovalStage` | Values, labels, required roles, order, isMiddleApprover, fromReferenceType |
| `EmailStatus` | Values, labels (Draf, Terkirim, Dalam Proses, Disetujui, Diarsipkan) |
| `RapbsStatus` | Values, labels, colors, canEdit, canSubmit, isInApprovalProcess, isFullyApproved |
| `RapbsApprovalStage` | Values, labels, requiredRole, unitFlow, substansiFlow, getNextStage, getFirstStage, getOrder, isFinal |

### 2. Unit Tests - Models

| Model | Test Coverage |
|-------|---------------|
| `User` | Factory states, relationships, hasEnumRole, scopeByRole, password hashing |
| `PengajuanAnggaran` | Factory states, relationships, scopes, computeAmountCategory, casts |
| `Lpj` | Factory states, relationships, scopes, getExpectedStages, canBeEdited, isFinal |
| `Approval` | Factory states, polymorphic relationships, stage ordering, status transitions |
| `Email` | Factory states (draft, sent, inProcess, approved, archived), relationships, scopes, casts |
| `Discussion` | Factory states (open, closed), relationships, opener/closer tracking |
| `MataAnggaran` | Factory states, relationships, hierarchy (SubMataAnggaran, DetailMataAnggaran) |
| `SubMataAnggaran` | Factory states, relationships to MataAnggaran and DetailMataAnggaran |
| `DetailMataAnggaran` | Factory states, budget tracking fields, withBudget/withUsage/withRealization |
| `Pkt` | Factory states (draft, submitted, approved), relationships, isDraft, isSubmitted, getCoaCode |
| `Rapbs` | Factory states (draft, submitted, verified, inReview, approved, rejected), canEdit, canSubmit, getExpectedFlow |
| `Apbs` | Factory states (active, closed, pending), isActive, isClosed, getRealisasiPercentage, budget calculations |

### 3. Unit Tests - Services

#### ApprovalService Tests

| Feature | Test Scenarios |
|---------|----------------|
| Submit | Unit user → StaffDirektur, Substansi → StaffKeuangan, amount category |
| Approve | Stage progression, role authorization, admin override, voucher generation |
| ApproveWithValidation | Finance validation data, reference type routing |
| Revise | Status change, revision stage saved |
| Resubmit | Returns to revision stage |
| Reject | Permanent workflow end |
| EditAmount | Keuangan/Bendahara only |
| GetNextStage | All routing scenarios (Education/HrGeneral/Secretariat, Low/High amount) |
| Discussion | Open/close discussion (leadership roles only) |
| MarkAsPaid | Payment details, status update |

#### LpjApprovalService Tests

| Feature | Test Scenarios |
|---------|----------------|
| Submit | Always starts at StaffKeuangan |
| Validate | Checklist validation, reference type routing |
| Approve | Stage progression, role authorization |
| Revise | Revision stage saved |
| Resubmit | Returns to revision stage or starts from beginning |
| Reject | Permanent workflow end |
| GetNextStage | Routing based on reference type |
| GetExpectedStages | Timeline generation |

#### PktService Tests

| Feature | Test Scenarios |
|---------|----------------|
| Create | Basic data, auto-create DetailMataAnggaran, get/create RAPBS, create RAPBS item |
| Update | PKT data, related DetailMataAnggaran, related RAPBS item |
| Delete | PKT and related records (DetailMataAnggaran, RapbsItem) |
| Submit | Status change to submitted |
| GetForUser | Filter by unit, year, status, search |

### 4. Feature Tests - API

#### Auth API
- Login with valid/invalid credentials
- Get authenticated user
- Logout

#### Dashboard API
- Statistics for different roles
- Chart data
- Recent proposals
- Status distribution

#### Pengajuan API
- CRUD operations
- Submit/Resubmit flow
- Permission checks
- Filtering and pagination

#### LPJ API
- CRUD operations
- Submit/Resubmit flow
- Validation with checklist
- Permission checks

#### Email/Surat Internal API
- List emails with pagination
- Show email details
- Create new email (draft status)
- Delete email
- Archive email
- Permission checks (view-emails, manage-emails)

#### PKT API
- List PKT (admin view all, unit view filtered)
- Create PKT with mata anggaran
- Show PKT details
- Update draft PKT
- Delete draft PKT
- Submit PKT (draft to submitted)
- Filter by status and year
- Permission checks (view-pkt, manage-pkt)

#### RAPBS API
- List RAPBS
- Show RAPBS details with items
- Submit RAPBS (requires items)
- Approval pending queue
- Approve RAPBS (role-based authorization)
- Revise RAPBS (requires notes)
- Reject RAPBS
- Approval history
- Recap by unit
- Permission checks (view-rapbs, manage-rapbs, approve-rapbs)

#### APBS API
- List APBS (filter by unit, year, status)
- Show APBS details
- Create APBS from approved RAPBS
- Update APBS (not closed)
- Delete APBS (pending only)
- Budget tracking (realization percentage)
- Permission checks (view-apbs, manage-apbs)

#### Notification API
- List notifications
- Unread count
- Mark as read
- Delete notifications

#### User Management API
- CRUD for users
- Password update
- Role filtering
- Unit management

### 5. Feature Tests - Workflows

#### Pengajuan Workflow Tests

Complete end-to-end workflow tests covering:

1. **Low Amount Education Flow (< 10 Juta)**
   - Unit → StaffDirektur → StaffKeuangan → Direktur → Keuangan → Bendahara → Kasir → Payment
   - Skips WakilKetua/Ketum for low amounts

2. **High Amount Education Flow (≥ 10 Juta)**
   - Includes WakilKetua → Ketum stages

3. **HrGeneral Reference Flow**
   - Routes to KabagSdmUmum instead of Direktur

4. **Secretariat Reference Flow**
   - Routes to KabagSekretariat

5. **Substansi Submission Flow**
   - Starts at StaffKeuangan (skips StaffDirektur)

6. **Revision Flow**
   - Returns to revision stage after resubmit

7. **Rejection Flow**
   - Workflow ends permanently

8. **Amount Edit Flow**
   - Only Keuangan/Bendahara can edit

9. **Discussion Flow**
   - Leadership roles can open/close

#### LPJ Workflow Tests

Complete end-to-end workflow tests covering:

1. **Education Reference Flow**
   - StaffKeuangan → Direktur → Keuangan

2. **HrGeneral Reference Flow**
   - Routes to KabagSdmUmum

3. **Secretariat Reference Flow**
   - Routes to KabagSekretariat

4. **Revision Flow**
   - Returns to revision stage

5. **Rejection Flow**
   - Workflow ends permanently

6. **Validation Checklist**
   - All items must be checked

7. **Authorization Checks**
   - Role-based access control

8. **Timeline Generation**
   - Correct stage statuses

## Model Factories

Located in `database/factories/`:

| Factory | States Available |
|---------|------------------|
| `UserFactory` | admin, unit, substansi, staffDirektur, staffKeuangan, direktur, kabagSdmUmum, wakilKetua, sekretaris, ketum, keuangan, bendahara, kasir, payment |
| `UnitFactory` | inactive, pg, sd, smp |
| `PengajuanAnggaranFactory` | draft, submitted, lowAmount, highAmount, withReferenceType, fromUnit, fromSubstansi, approved, paid, needsLpj, revisionRequired, rejected |
| `LpjFactory` | draft, submitted, validated, approvedByMiddle, approved, revised, rejected, education, hrGeneral, secretariat |
| `ApprovalFactory` | pending, approved, revised, rejected, forStage, staffDirektur, staffKeuangan, direktur, keuangan, bendahara, kasir, payment |
| `EmailFactory` | draft, sent, inProcess, approved, archived, needsRevision |
| `DiscussionFactory` | open, closed, openedBy, closedBy, forPengajuan |
| `MataAnggaranFactory` | pengeluaran, penerimaan, forUnit, forYear |
| `SubMataAnggaranFactory` | forMataAnggaran, forUnit |
| `DetailMataAnggaranFactory` | forMataAnggaran, forSubMataAnggaran, forUnit, forYear, withBudget, withUsage, withRealization |
| `PktFactory` | draft, submitted, approved, forUnit, forYear, withBudget, createdBy, withPlanning, withMataAnggaran |
| `RapbsFactory` | draft, submitted, verified, inReview, approved, apbsGenerated, active, rejected, forUnit, forYear, withTotal, submittedBy, atStage |
| `ApbsFactory` | active, closed, pending, forUnit, fromRapbs, forYear, withBudget, fullyRealized, noRealization, withRealizationPercent, signed |

## Test Coverage Metrics

### Enums: 100%
All enums have complete test coverage including:
- All case values
- All method returns
- Edge cases

### Models: 95%+
Core model features tested:
- Factory creation
- Relationships
- Scopes
- Casts
- Helper methods
- Budget tracking (APBS)
- COA code generation (PKT)

### Services: 95%+
Business logic fully tested:
- All public methods
- All routing scenarios
- Error handling
- Edge cases
- Transaction integrity

### API Endpoints: 90%+
Major endpoints tested:
- CRUD operations
- Permission checks
- Validation
- Error responses
- Filtering and pagination

## Best Practices

1. **Use RefreshDatabase trait** - Ensures clean database state for each test
2. **Fake notifications** - Prevents actual notification sending during tests
3. **Use factories** - Consistent test data generation
4. **Test happy path and edge cases** - Complete coverage
5. **Group related tests with describe blocks** - Better organization
6. **Use meaningful test descriptions** - Self-documenting tests

## Adding New Tests

1. Create test file in appropriate directory
2. Use `uses(RefreshDatabase::class)` for database tests
3. Create factory states if needed
4. Follow existing naming conventions
5. Group tests with `describe` blocks
6. Use `beforeEach` for common setup

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Tests
  run: |
    php artisan config:clear
    php artisan test --coverage --min=80
```

## Troubleshooting

### Common Issues

1. **Permission errors in tests**
   - Ensure Spatie permissions are seeded in test setup

2. **Database state issues**
   - Use `RefreshDatabase` trait
   - Check for hardcoded IDs

3. **Notification errors**
   - Use `Notification::fake()` in `beforeEach`

4. **Factory relation issues**
   - Ensure all required relations are set up

## Modules Tested

### Core Modules (Completed)
- [x] Pengajuan Anggaran (Budget Proposal)
- [x] LPJ (Accountability Report)
- [x] Approval Workflows
- [x] User Management
- [x] Dashboard
- [x] Notifications
- [x] Authentication

### Planning & Budgeting Modules (Completed)
- [x] PKT (Annual Work Program)
- [x] RAPBS (Budget Planning)
- [x] APBS (Approved Budget)
- [x] Mata Anggaran Hierarchy (MataAnggaran, SubMataAnggaran, DetailMataAnggaran)

### Communication Modules (Completed)
- [x] Email/Surat Internal
- [x] Discussion

### Future Test Additions
Consider adding tests for:
- [ ] Strategy & Indicators (Planning hierarchy)
- [ ] Budget Amendment (Perubahan Anggaran)
- [ ] Export functionality (Excel, PDF)
- [ ] File attachments
- [ ] Activity logging

---

Last Updated: February 2026
