import { Alert, Card, Input, Label, Textarea } from "@devora/ui";
import {
  createCrmActivity,
  createCrmTask,
  transitionCrmTask,
} from "../../../lib/crm/activity-task-actions";
import {
  ACTIVITY_TYPES,
  activityTypeLabels,
  formatOperationDate,
  taskStatusLabels,
} from "../../../lib/crm/activity-task";
import { PipelineSubmit } from "./pipeline-submit";
type Activity = {
  id: string;
  activity_type: (typeof ACTIVITY_TYPES)[number];
  title: string;
  description: string | null;
  occurred_at: string;
};
type Task = {
  id: string;
  title: string;
  due_at: string;
  status: "pending" | "completed" | "cancelled";
  version: number;
};
export function ActivityTaskPanel({
  canWrite,
  returnTo,
  members,
  link,
  activities,
  tasks,
}: {
  canWrite: boolean;
  returnTo: string;
  members: { id: string; label: string }[];
  link: {
    leadId?: string | null;
    opportunityId?: string | null;
    companyId?: string | null;
    contactId?: string | null;
  };
  activities: Activity[];
  tasks: Task[];
}) {
  const hidden = Object.entries(link)
    .filter(([, v]) => v)
    .map(([name, value]) => (
      <input key={name} type="hidden" name={name} value={value ?? ""} />
    ));
  const next = tasks.find((task) => task.status === "pending");
  return (
    <section className="crm-stack" aria-labelledby="commercial-follow-up">
      <h2 id="commercial-follow-up">Acompanhamento comercial</h2>
      {next ? (
        <Alert variant="info">
          Próxima ação: {next.title}, {formatOperationDate(next.due_at)}.
        </Alert>
      ) : (
        <Alert variant="warning">Nenhuma próxima ação pendente.</Alert>
      )}
      {canWrite ? (
        <div className="crm-detail-grid">
          {link.leadId || link.opportunityId ? (
            <Card>
              <h3>Registrar atividade</h3>
              <form action={createCrmActivity} className="crm-form">
                <input type="hidden" name="returnTo" value={returnTo} />
                {hidden}
                <div>
                  <Label htmlFor="activityType">Tipo</Label>
                  <select id="activityType" name="activityType">
                    {ACTIVITY_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {activityTypeLabels[v]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="occurredAt">Data e hora</Label>
                  <Input
                    id="occurredAt"
                    name="occurredAt"
                    type="datetime-local"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="activityTitle">Resumo</Label>
                  <Input
                    id="activityTitle"
                    name="title"
                    required
                    minLength={2}
                    maxLength={160}
                  />
                </div>
                <div>
                  <Label htmlFor="activityAssignee">Responsável</Label>
                  <select
                    id="activityAssignee"
                    name="assignedMembershipId"
                    required
                  >
                    {members.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <Label htmlFor="activityDescription">
                    Observação opcional
                  </Label>
                  <Textarea
                    id="activityDescription"
                    name="description"
                    maxLength={2000}
                  />
                </div>
                <PipelineSubmit>Registrar atividade</PipelineSubmit>
              </form>
            </Card>
          ) : null}
          <Card>
            <h3>Criar próxima ação</h3>
            <form action={createCrmTask} className="crm-form">
              <input type="hidden" name="returnTo" value={returnTo} />
              {hidden}
              <div>
                <Label htmlFor="taskTitle">Título</Label>
                <Input
                  id="taskTitle"
                  name="title"
                  required
                  minLength={2}
                  maxLength={160}
                />
              </div>
              <div>
                <Label htmlFor="dueAt">Prazo</Label>
                <Input id="dueAt" name="dueAt" type="datetime-local" required />
              </div>
              <div>
                <Label htmlFor="taskAssignee">Responsável</Label>
                <select id="taskAssignee" name="assignedMembershipId" required>
                  {members.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crm-field">
                <Label htmlFor="taskDescription">Descrição opcional</Label>
                <Textarea
                  id="taskDescription"
                  name="description"
                  maxLength={1000}
                />
              </div>
              <PipelineSubmit>Criar tarefa</PipelineSubmit>
            </form>
          </Card>
        </div>
      ) : null}
      <div className="crm-detail-grid">
        <Card>
          <h3>Timeline de atividades</h3>
          {activities.length ? (
            <ol className="pipeline-history">
              {activities.map((item) => (
                <li key={item.id}>
                  <strong>
                    {activityTypeLabels[item.activity_type]} · {item.title}
                  </strong>
                  <span>{formatOperationDate(item.occurred_at)}</span>
                  {item.description ? <p>{item.description}</p> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p>Nenhuma atividade registrada ainda.</p>
          )}
        </Card>
        <Card>
          <h3>Tarefas</h3>
          {tasks.length ? (
            <ul className="crm-task-list">
              {tasks.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>
                      {taskStatusLabels[task.status]} ·{" "}
                      {formatOperationDate(task.due_at)}
                    </span>
                  </div>
                  {canWrite ? (
                    <form action={transitionCrmTask}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input
                        type="hidden"
                        name="version"
                        value={task.version}
                      />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      {task.status === "pending" ? (
                        <>
                          <button name="status" value="completed">
                            Concluir
                          </button>
                          <button name="status" value="cancelled">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button name="status" value="pending">
                          Reabrir
                        </button>
                      )}
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma tarefa registrada.</p>
          )}
        </Card>
      </div>
    </section>
  );
}
